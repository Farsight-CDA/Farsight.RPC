using EtherSharp.Client;
using EtherSharp.Common.Exceptions;
using EtherSharp.Numerics;
using EtherSharp.Query;
using EtherSharp.RPC.Modules.Eth;
using EtherSharp.Types;
using Farsight.Common;
using Farsight.Rpc.Types;
using System.Buffers;
using System.Buffers.Binary;
using System.Globalization;
using System.Text.RegularExpressions;

namespace Farsight.Rpc.Api.Services;

public sealed partial class RpcCapabilityProbe : Transient
{
    private const ulong MAXIMUM_LOGS_PROBERANGE = 100_000;
    private static readonly ulong[] _ethGetLogsProbeRanges =
    [
        10_000,
        5_000,
        2_000,
        1_000,
    ];
    private static readonly Address _overrideProbeAddress = Address.Parse("0x000000000000000000000000000000000000fa57");
    private static readonly SearchValues<string> _recognizedMethodErrors = SearchValues.Create(
        [
            "invalid argument",
            "invalid params",
            "invalid hash",
            "transaction not found",
            "tx not found",
            "transaction 0x0000000000000000000000000000000000000000000000000000000000000000 not found",
            "unknown transaction",
            "no transaction found",
            "genesis is not traceable",
        ],
        StringComparison.OrdinalIgnoreCase
    );

    public async Task<RpcProbeResult> ProbeAsync(Uri address, CancellationToken cancellationToken = default)
    {
        await using var client = address.Scheme is "ws" or "wss"
            ? EtherClientBuilder.CreateForWebsocket(address).BuildReadClient()
            : EtherClientBuilder.CreateForHttpRpc(address).BuildReadClient();

        var (chainId, latestBlockNumber, latestBlockTime, compatibility) = await client.InitializeAsync(
            IQuery.Combine(
                IQuery.GetChainId(),
                IQuery.GetBlockNumber(),
                IQuery.GetBlockTimestamp(),
                IQuery.GetCompatibilityReport()),
            cancellationToken
        );

        var ethRpcModule = client.AsInternal().Provider.GetRequiredService<IEthRpcModule>();

        bool archive = await ProbeArchiveAsync(ethRpcModule, cancellationToken);
        (bool debugApi, string? debugApiError, bool tracingApi, string? tracingApiError) =
            await ProbeTracingApisAsync(client, cancellationToken);
        (bool stateOverrides, bool blockOverrides) = await ProbeOverridesAsync(ethRpcModule, cancellationToken);
        (ulong? ethGetLogsLimit, string? ethGetLogsError) = await ProbeEthGetLogsLimitAsync(
            ethRpcModule,
            latestBlockNumber,
            cancellationToken
        );

        var capabilities = new List<RpcCapability>(7);
        if(archive)
        {
            capabilities.Add(RpcCapability.Archive);
        }
        if(debugApi)
        {
            capabilities.Add(RpcCapability.DebugApi);
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
            ethGetLogsError,
            debugApiError,
            tracingApiError
        );
    }

    private static async Task<bool> ProbeArchiveAsync(IEthRpcModule eth, CancellationToken cancellationToken)
    {
        try
        {
            await eth.GetBalanceAsync(_overrideProbeAddress, TargetHeight.Height(1), cancellationToken);
            await eth.GetTransactionCountAsync(_overrideProbeAddress, TargetHeight.Height(1), cancellationToken);
            return true;
        }
        catch(RPCException)
        {
            return false;
        }
        catch(RPCTransportException)
        {
            return false;
        }
    }

    private static async Task<(ulong? Limit, string? Error)> ProbeEthGetLogsLimitAsync(
        IEthRpcModule eth,
        ulong latestBlockNumber,
        CancellationToken cancellationToken)
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
                return (range, error);
            }
            catch(Exception ex) when(ex is RPCException or RPCTransportException)
            {
            }
        }

        return (null, error);
    }

    [GeneratedRegex(
        @"(?:limited to [\d,]+\s*-\s*|maximum block range:\s*|maximum \[from,\s*to\] blocks distance:\s*|maximum allowed is\s*|maximum is set to\s*|maximum(?: of)?\s+|limited to (?:a )?|up to (?:a )?|at most\s*|block range limit is\s*|max block range\s*|block range greater than\s*|exceeds the limit\s*)(?<limit>[\d,]+)",
        RegexOptions.IgnoreCase | RegexOptions.CultureInvariant)
    ]
    private static partial Regex EthGetLogsLimitErrorRegex();

    private static async Task<(bool DebugApi, string? DebugApiError, bool TracingApi, string? TracingApiError)>
        ProbeTracingApisAsync(
        IEtherClient client,
        CancellationToken cancellationToken)
    {
        bool debugApi;
        string? debugApiError = null;
        try
        {
            await client.Debug.TraceTransactionCallsAsync(Bytes32.Zero, cancellationToken);
            debugApi = true;
        }
        catch(RPCException ex)
        {
            debugApi = ex.Code == -32602 || ex.Message.ContainsAny(_recognizedMethodErrors);
            if(!debugApi)
            {
                debugApiError = ex.Message;
            }
        }
        catch(RPCTransportException ex)
        {
            debugApi = false;
            debugApiError = ex.Message;
        }

        bool tracingApi;
        string? tracingApiError = null;
        try
        {
            await client.Trace.TraceTransactionCallsAsync(Bytes32.Zero, cancellationToken);
            tracingApi = true;
        }
        catch(RPCException ex)
        {
            tracingApi = ex.Code == -32602 || ex.Message.ContainsAny(_recognizedMethodErrors);
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

        return (debugApi, debugApiError, tracingApi, tracingApiError);
    }

    private static async Task<(bool StateOverrides, bool BlockOverrides)> ProbeOverridesAsync(
        IEthRpcModule eth,
        CancellationToken cancellationToken)
    {
        bool stateOverrides = await ExecuteOverrideProbeAsync(
            eth,
            new StateOverride(code: Convert.FromHexString("602A60005260206000F3")),
            blockOverrides: null,
            expected: 42,
            cancellationToken);

        if(!stateOverrides)
        {
            return (false, false);
        }

        const ulong BLOCK_OVERRIDE_TIMESTAMP = 4_102_444_800;

        bool blockOverrides = await ExecuteOverrideProbeAsync(
                eth,
                new StateOverride(code: Convert.FromHexString("4260005260206000F3")),
                new BlockOverride(Time: BLOCK_OVERRIDE_TIMESTAMP),
                BLOCK_OVERRIDE_TIMESTAMP,
                cancellationToken);

        return (true, blockOverrides);
    }

    private static async Task<bool> ExecuteOverrideProbeAsync(
        IEthRpcModule eth,
        StateOverride stateOverride,
        BlockOverride? blockOverrides,
        ulong expected,
        CancellationToken cancellationToken)
    {
        try
        {
            var stateOverrides = new Dictionary<Address, StateOverride>
            {
                [_overrideProbeAddress] = stateOverride,
            };

            var result = await eth.CallAsync(
                from: null,
                to: _overrideProbeAddress,
                gas: null,
                gasPrice: null,
                value: UInt256.Zero,
                data: ReadOnlyMemory<byte>.Empty,
                blockNumber: TargetHeight.Latest,
                stateOverrides,
                blockOverrides,
                cancellationToken);

            if(!result.Success || result.Data.Length != 32)
            {
                return false;
            }

            Span<byte> expectedResult = stackalloc byte[32];
            BinaryPrimitives.WriteUInt64BigEndian(expectedResult[24..], expected);
            return result.Data.Span.SequenceEqual(expectedResult);
        }
        catch(RPCException)
        {
            return false;
        }
    }
}
