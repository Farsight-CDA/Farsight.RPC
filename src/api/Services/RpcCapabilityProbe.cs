using EtherSharp.Client;
using EtherSharp.Common.Exceptions;
using EtherSharp.Numerics;
using EtherSharp.Query;
using EtherSharp.RPC.Modules.Eth;
using EtherSharp.Tx;
using EtherSharp.Tx.Legacy;
using EtherSharp.Types;
using EtherSharp.Wallet;
using Farsight.Common;
using Farsight.Rpc.Types;
using Farsight.Rpc.Types.Evm;
using System.Buffers;
using System.Buffers.Binary;
using System.Globalization;
using System.Text.RegularExpressions;

namespace Farsight.Rpc.Api.Services;

public sealed partial class RpcCapabilityProbe : Transient
{
    private const ulong MAXIMUM_LOGS_PROBERANGE = 100_000;
    private static readonly EtherHdWallet _transactionProbeSigner = EtherHdWallet.Create();
    private static readonly TimeSpan _tracingApiProbeTimeout = TimeSpan.FromSeconds(3);
    private const string DEBUG_JS_TRACER =
        "{step:function(){},fault:function(){},result:function(){return 1;}}";
    private static readonly ulong[] _ethGetLogsProbeRanges =
    [
        10_000,
        5_000,
        2_000,
        1_000,
        500,
        100
    ];
    private static readonly Address _overrideProbeAddress = Address.Parse("0x000000000000000000000000000000000000fa57");
    private static readonly SearchValues<string> _recognizedJsTracerUnsupportedErrors = SearchValues.Create(
        [
            "unknown variant",
            "custom traces are blocked",
            "JS Tracer is not enabled",
            "Bad request input parameters",
            "runtime error: invalid memory address or nil pointer dereference",
        ],
        StringComparison.OrdinalIgnoreCase
    );
    private static readonly SearchValues<string> _recognizedTracingApiErrors = SearchValues.Create(
        [
            "transaction not found",
            "receipt could not be found",
        ],
        StringComparison.OrdinalIgnoreCase
    );
    private static readonly SearchValues<string> _recognizedSendRawTransactionErrors = SearchValues.Create(
        [
            "insufficient funds",
            "Insufficient balance",
            "insufficient fee",
            "tx fee",
            "exceeds transaction sender account balance",
            "gas price",
            "base fee",
            "already known",
            "transaction underpriced",
            "insufficient to cover the transaction cost",
            "Gas limit too low",
            "the sender account doesn't exist",
            "cannot pay gas",
            "Transaction fee too low",
            "value transfer not allowed",
        ],
        StringComparison.OrdinalIgnoreCase
    );
    private static readonly SearchValues<string> _recognizedCreateAccessListErrors = SearchValues.Create(
        [
            "insufficient funds",
            "header not found",
        ],
        StringComparison.OrdinalIgnoreCase
    );

    public async Task<RpcProbeResult> ProbeAsync(
        Uri address,
        RpcErrorGroupDto[] errorGroups,
        CancellationToken cancellationToken = default)
    {
        var clientBuilder = address.Scheme is "ws" or "wss"
            ? EtherClientBuilder.CreateForWebsocket(address)
            : EtherClientBuilder.CreateForHttpRpc(address);
        clientBuilder.AddRPCMiddleware(new EvmRpcResiliencyMiddleware(
            address.Host,
            errorGroups.Where(group => group.Action == RpcErrorAction.Transient))
        );

        await using var client = clientBuilder.BuildReadClient();

        var (chainId, latestBlockNumber, latestBlockTime, compatibility) = await client.InitializeAsync(
            IQuery.Combine(
                IQuery.GetChainId(),
                IQuery.GetBlockNumber(),
                IQuery.GetBlockTimestamp(),
                IQuery.GetCompatibilityReport()),
            cancellationToken
        );

        var ethRpcModule = client.AsInternal().Provider.GetRequiredService<IEthRpcModule>();

        (bool archive, var archiveError) =
            await ProbeArchiveAsync(ethRpcModule, cancellationToken);
        (bool debugApi, bool debugJsTracers, bool tracingApi, var tracingErrors) =
            await ProbeTracingApisAsync(client, cancellationToken);
        (bool stateOverrides, bool blockOverrides, var overrideError) =
            await ProbeOverridesAsync(ethRpcModule, cancellationToken);
        (ulong? ethGetLogsLimit, var ethGetLogsError) = await ProbeEthGetLogsLimitAsync(
            ethRpcModule,
            latestBlockNumber,
            cancellationToken
        );
        (bool sendRawTransaction, var sendRawTransactionError) =
            await ProbeSendRawTransactionAsync(chainId, ethRpcModule, cancellationToken);
        (bool createAccessList, var createAccessListError) =
            await ProbeCreateAccessListAsync(ethRpcModule, latestBlockNumber, cancellationToken);

        var capabilities = new List<RpcCapability>(10);
        if(archive)
        {
            capabilities.Add(RpcCapability.Archive);
        }
        if(debugApi)
        {
            capabilities.Add(RpcCapability.DebugApi);
        }
        if(debugJsTracers)
        {
            capabilities.Add(RpcCapability.DebugJsTracers);
        }
        if(tracingApi)
        {
            capabilities.Add(RpcCapability.TracingApi);
        }
        if(stateOverrides)
        {
            capabilities.Add(RpcCapability.StateOverrides);
        }
        if(blockOverrides)
        {
            capabilities.Add(RpcCapability.BlockOverrides);
        }
        if(address.Scheme == "wss")
        {
            capabilities.Add(RpcCapability.Subscriptions);
        }
        if(ethGetLogsLimit is not null)
        {
            capabilities.Add(RpcCapability.GetLogs);
        }
        if(sendRawTransaction)
        {
            capabilities.Add(RpcCapability.SendRawTransaction);
        }
        if(createAccessList)
        {
            capabilities.Add(RpcCapability.CreateAccessList);
        }

        var errors = new List<RpcCapabilityError>(tracingErrors.Length + 5);
        if(archiveError is not null)
        {
            errors.Add(archiveError);
        }
        errors.AddRange(tracingErrors);
        if(overrideError is not null)
        {
            errors.Add(overrideError);
        }
        if(ethGetLogsError is not null)
        {
            errors.Add(ethGetLogsError);
        }
        if(sendRawTransactionError is not null)
        {
            errors.Add(sendRawTransactionError);
        }
        if(createAccessListError is not null)
        {
            errors.Add(createAccessListError);
        }

        return new RpcProbeResult(
            chainId,
            latestBlockNumber,
            latestBlockTime,
            new RpcCompatibilityReport(
                compatibility.SupportsPush0,
                compatibility.SupportsMCopy,
                compatibility.SupportsTStore,
                compatibility.SupportsBaseFee),
            [.. capabilities],
            ethGetLogsLimit,
            errors.Count == 0 ? null : [.. errors]
        );
    }

    public static async Task<(bool Supported, RpcCapabilityError? Error)> ProbeCreateAccessListAsync(
        IEthRpcModule eth, ulong latestBlockNumber, CancellationToken cancellationToken)
    {
        try
        {
            await eth.CreateAccessListAsync(
                _transactionProbeSigner.Address,
                UInt256.Zero,
                ReadOnlyMemory<byte>.Empty,
                null,
                new CallOptions
                {
                    From = _transactionProbeSigner.Address,
                    TargetHeight = TargetHeight.Height(latestBlockNumber),
                },
                cancellationToken
            );
            return (true, null);
        }
        catch(RPCException ex) when(ex.Message.ContainsAny(_recognizedCreateAccessListErrors))
        {
            return (true, null);
        }
        catch(Exception ex)
        {
            return (false, new RpcCapabilityError(RpcCapability.CreateAccessList, ex.Message));
        }
    }

    public static async Task<(bool Supported, RpcCapabilityError? Error)> ProbeSendRawTransactionAsync(
        ulong chainId, IEthRpcModule eth, CancellationToken cancellationToken)
    {
        var handler = new LegacyTxTypeHandler(_transactionProbeSigner);
        await handler.InitializeAsync(chainId, cancellationToken);

        var signedTx = await handler.EncodeTxAsync(
            ITxInput.ForEthTransfer(_transactionProbeSigner.Address, 1),
            LegacyTxParams.Default,
            new LegacyGasParams(21000, UInt256.Pow(10, 9)),
            1,
            cancellationToken
        );

        try
        {
            await eth.SendRawTransactionAsync(signedTx.EncodedTx, cancellationToken);
            return (false, new RpcCapabilityError(
                RpcCapability.SendRawTransaction,
                "RPC unexpectedly accepted the eth_sendRawTransaction probe transaction."));
        }
        catch(RPCException ex)
        {
            bool supported = ex.Message.ContainsAny(_recognizedSendRawTransactionErrors);
            return supported
                ? (true, null)
                : (false, new RpcCapabilityError(RpcCapability.SendRawTransaction, ex.Message));
        }
        catch(RPCTransportException ex)
        {
            return (false, new RpcCapabilityError(RpcCapability.SendRawTransaction, ex.Message));
        }
    }

    public static async Task<(bool Supported, RpcCapabilityError? Error)> ProbeArchiveAsync(
        IEthRpcModule eth, CancellationToken cancellationToken)
    {
        try
        {
            await eth.GetBalanceAsync(_overrideProbeAddress, TargetHeight.Height(1), cancellationToken);
            await eth.GetTransactionCountAsync(_overrideProbeAddress, TargetHeight.Height(1), cancellationToken);
            return (true, null);
        }
        catch(RPCException ex)
        {
            return (false, new RpcCapabilityError(RpcCapability.Archive, ex.Message));
        }
        catch(RPCTransportException ex)
        {
            return (false, new RpcCapabilityError(RpcCapability.Archive, ex.Message));
        }
    }

    public static async Task<(ulong? Limit, RpcCapabilityError? Error)> ProbeEthGetLogsLimitAsync(
        IEthRpcModule eth, ulong latestBlockNumber, CancellationToken cancellationToken)
    {
        Task GetLogsAsync(TargetHeight fromBlock)
            => eth.GetLogsAsync(
                fromBlock,
                TargetHeight.Height(latestBlockNumber),
                [_overrideProbeAddress],
                [],
                blockHash: null,
                cancellationToken
            );

        ulong availableRange = latestBlockNumber + 1;
        ulong maximumRange = Math.Min(MAXIMUM_LOGS_PROBERANGE, availableRange);
        ulong maximumFromBlock = latestBlockNumber - (maximumRange - 1);

        string error;
        try
        {
            await GetLogsAsync(maximumFromBlock == 0
                ? TargetHeight.Earliest
                : TargetHeight.Height(maximumFromBlock));
            return (maximumRange, null);
        }
        catch(Exception ex) when(ex is RPCException or RPCTransportException)
        {
            var match = EthGetLogsLimitErrorRegex().Match(ex.Message);
            ulong limit = 0;
            bool parsed = match.Success &&
                UInt64.TryParse(
                    match.Groups["limit"].Value,
                    NumberStyles.AllowThousands,
                    CultureInfo.InvariantCulture,
                    out limit
                ) && limit > 0;

            if(parsed)
            {
                return (Math.Min(limit, MAXIMUM_LOGS_PROBERANGE), null);
            }

            error = ex.Message;
        }

        ulong previousRange = maximumRange;

        foreach(ulong configuredRange in _ethGetLogsProbeRanges)
        {
            ulong range = Math.Min(configuredRange, availableRange);
            if(range == previousRange)
            {
                continue;
            }

            previousRange = range;
            ulong fromBlock = latestBlockNumber - (range - 1);
            try
            {
                await GetLogsAsync(fromBlock == 0 ? TargetHeight.Earliest : TargetHeight.Height(fromBlock));
                return (range, new RpcCapabilityError(RpcCapability.GetLogs, error));
            }
            catch(Exception ex) when(ex is RPCException or RPCTransportException)
            {
            }
        }

        return (null, new RpcCapabilityError(RpcCapability.GetLogs, error));
    }

    [GeneratedRegex(
        @"(?:limited to [\d,]+\s*-\s*|maximum block range:\s*|maximum \[from,\s*to\] blocks distance:\s*|maximum allowed is\s*|maximum is set to\s*|maximum(?: of)?\s+|limited to (?:a )?|up to (?:a )?|at most\s*|block range limit is\s*|max block range\s*|block range greater than\s*|ranges over\s*|exceeds the limit\s*)(?<limit>[\d,]+)",
        RegexOptions.IgnoreCase | RegexOptions.CultureInvariant)
    ]
    private static partial Regex EthGetLogsLimitErrorRegex();

    public static async Task<(bool DebugApi, bool DebugJsTracers, bool TracingApi, RpcCapabilityError[] Errors)> ProbeTracingApisAsync(
        IEtherClient client, CancellationToken cancellationToken)
    {
        bool debugApi;
        bool debugJsTracers;
        string? debugApiError = null;
        string? debugJsTracersError = null;
        try
        {
            using var cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            cts.CancelAfter(_tracingApiProbeTimeout);
            int result = await client.Debug.TraceCallJavaScriptAsync<object, int>(
                _overrideProbeAddress,
                gas: null,
                gasPrice: null,
                UInt256.Zero,
                ReadOnlyMemory<byte>.Empty,
                TargetHeight.Latest,
                new JavaScriptTracer(DEBUG_JS_TRACER),
                new { },
                cts.Token);
            debugApi = true;
            debugJsTracers = result == 1;

            if(!debugJsTracers)
            {
                debugJsTracersError = "Debug API did not return the expected JavaScript tracer result.";
            }
        }
        catch(OperationCanceledException) when(!cancellationToken.IsCancellationRequested)
        {
            debugApi = false;
            debugJsTracers = false;
            debugApiError = $"Debug API probe timed out after {_tracingApiProbeTimeout.TotalSeconds} seconds.";
            debugJsTracersError = debugApiError;
        }
        catch(RPCException ex)
        {
            debugApi = ex.Message.ContainsAny(_recognizedJsTracerUnsupportedErrors);
            debugJsTracers = false;

            if(debugApi)
            {
                debugJsTracersError = ex.Message;
            }
            else
            {
                debugApiError = ex.Message;
                debugJsTracersError = ex.Message;
            }
        }
        catch(RPCTransportException ex)
        {
            debugApi = false;
            debugJsTracers = false;
            debugApiError = ex.Message;
            debugJsTracersError = ex.Message;
        }

        bool tracingApi;
        string? tracingApiError = null;
        try
        {
            using var cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            cts.CancelAfter(_tracingApiProbeTimeout);
            await client.Trace.TraceTransactionCallsAsync(Bytes32.Zero, cts.Token);
            tracingApi = true;
        }
        catch(OperationCanceledException) when(!cancellationToken.IsCancellationRequested)
        {
            tracingApi = false;
            tracingApiError = $"Tracing API probe timed out after {_tracingApiProbeTimeout.TotalSeconds} seconds.";
        }
        catch(RPCException ex)
        {
            tracingApi = ex.Message.ContainsAny(_recognizedTracingApiErrors);
            if(!tracingApi)
            {
                tracingApiError = ex.Message;
            }
        }
        catch(RPCTransportException ex)
        {
            tracingApi = false;
            tracingApiError = ex.Message;
        }

        var errors = new List<RpcCapabilityError>(3);
        if(debugApiError is not null)
        {
            errors.Add(new RpcCapabilityError(RpcCapability.DebugApi, debugApiError));
        }
        if(debugJsTracersError is not null)
        {
            errors.Add(new RpcCapabilityError(RpcCapability.DebugJsTracers, debugJsTracersError));
        }
        if(tracingApiError is not null)
        {
            errors.Add(new RpcCapabilityError(RpcCapability.TracingApi, tracingApiError));
        }

        return (debugApi, debugJsTracers, tracingApi, [.. errors]);
    }

    public static async Task<(bool StateOverrides, bool BlockOverrides, RpcCapabilityError? Error)> ProbeOverridesAsync(
        IEthRpcModule eth, CancellationToken cancellationToken)
    {
        (bool stateOverrides, string? stateOverrideError) = await ExecuteOverrideProbeAsync(
            eth,
            new AccountOverride(code: Convert.FromHexString("602A60005260206000F3")),
            blockOverrides: null,
            expected: 42,
            cancellationToken);

        if(!stateOverrides)
        {
            return (false, false, stateOverrideError is null
                ? null
                : new RpcCapabilityError(RpcCapability.StateOverrides, stateOverrideError));
        }

        const ulong BLOCK_OVERRIDE_TIMESTAMP = 4_102_444_800;

        (bool blockOverrides, string? blockOverrideError) = await ExecuteOverrideProbeAsync(
                eth,
                new AccountOverride(code: Convert.FromHexString("4260005260206000F3")),
                new BlockOverride(Time: BLOCK_OVERRIDE_TIMESTAMP),
                BLOCK_OVERRIDE_TIMESTAMP,
                cancellationToken);

        return (true, blockOverrides, blockOverrideError is null
            ? null
            : new RpcCapabilityError(RpcCapability.BlockOverrides, blockOverrideError));
    }

    private static async Task<(bool Supported, string? Error)> ExecuteOverrideProbeAsync(
        IEthRpcModule eth,
        AccountOverride stateOverride,
        BlockOverride? blockOverrides,
        ulong expected,
        CancellationToken cancellationToken)
    {
        try
        {
            var stateOverrides = new Dictionary<Address, AccountOverride>
            {
                [_overrideProbeAddress] = stateOverride,
            };

            var result = await eth.CallAsync(
                to: _overrideProbeAddress,
                gas: null,
                gasPrice: null,
                value: UInt256.Zero,
                data: ReadOnlyMemory<byte>.Empty,
                options: new CallOptions
                {
                    TargetHeight = TargetHeight.Latest,
                    StateOverrides = stateOverrides,
                    BlockOverrides = blockOverrides,
                },
                cancellationToken);

            if(!result.Success || result.Data.Length != 32)
            {
                return (false, null);
            }

            Span<byte> expectedResult = stackalloc byte[32];
            BinaryPrimitives.WriteUInt64BigEndian(expectedResult[24..], expected);
            return (result.Data.Span.SequenceEqual(expectedResult), null);
        }
        catch(RPCException ex)
        {
            return (false, ex.Message);
        }
        catch(RPCTransportException ex)
        {
            return (false, ex.Message);
        }
    }
}
