using EtherSharp.Client;
using EtherSharp.Common.Exceptions;
using EtherSharp.Numerics;
using EtherSharp.Query;
using EtherSharp.RPC.Modules.Eth;
using EtherSharp.Types;
using Farsight.Common;
using Farsight.Rpc.Types;
using Microsoft.Extensions.DependencyInjection;
using System.Buffers;
using System.Buffers.Binary;

namespace Farsight.Rpc.Api.Services;

public sealed partial class RpcCapabilityProbe : Transient
{
    private static readonly Address _overrideProbeAddress = Address.Parse("0x000000000000000000000000000000000000fa57");
    private static readonly SearchValues<string> _recognizedMethodErrors = SearchValues.Create(
        [
            "invalid argument",
            "invalid params",
            "invalid hash",
            "transaction not found",
            "unknown transaction",
            "no transaction found",
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

        bool archive = await ProbeArchiveAsync(client, cancellationToken);
        (bool debugApi, bool tracingApi) = await ProbeTracingApisAsync(client, cancellationToken);
        (bool stateOverrides, bool blockOverrides) = await ProbeOverridesAsync(ethRpcModule, cancellationToken);

        var capabilities = new List<RpcCapability>(6);
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

        return new RpcProbeResult(
            chainId,
            latestBlockNumber,
            latestBlockTime,
            new RpcCompatibilityReport(
                compatibility.SupportsPush0,
                compatibility.SupportsMCopy,
                compatibility.SupportsTStore,
                compatibility.SupportsBaseFee),
            [.. capabilities]);
    }

    private static async Task<bool> ProbeArchiveAsync(IEtherClient client, CancellationToken cancellationToken)
    {
        try
        {
            var (blockNumber, _, _, hasCode, code) = await client.QueryAsync(
                IQuery.Combine(
                    IQuery.GetBlockNumber(),
                    IQuery.GetBlockTimestamp(),
                    IQuery.GetBalance(_overrideProbeAddress),
                    IQuery.HasCode(_overrideProbeAddress),
                    IQuery.GetCode(_overrideProbeAddress)),
                targetHeight: TargetHeight.Height(1),
                cancellationToken: cancellationToken);

            return blockNumber == 1 && hasCode == !code.ByteCode.IsEmpty;
        }
        catch(RPCException)
        {
            return false;
        }
    }

    private static async Task<(bool DebugApi, bool TracingApi)> ProbeTracingApisAsync(
        IEtherClient client,
        CancellationToken cancellationToken)
    {
        bool debugApi;
        try
        {
            await client.Debug.TraceTransactionCallsAsync(Bytes32.Zero, cancellationToken);
            debugApi = true;
        }
        catch(RPCException ex)
        {
            debugApi = ex.Code == -32602 || ex.Message.ContainsAny(_recognizedMethodErrors);
        }

        bool tracingApi;
        try
        {
            await client.Trace.TraceTransactionCallsAsync(Bytes32.Zero, cancellationToken);
            tracingApi = true;
        }
        catch(RPCException ex)
        {
            tracingApi = ex.Code == -32602 || ex.Message.ContainsAny(_recognizedMethodErrors);
        }

        return (debugApi, tracingApi);
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
