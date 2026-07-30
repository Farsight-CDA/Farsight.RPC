namespace Farsight.Rpc.Types;

public sealed record RpcProbeResult(
    ulong ChainId,
    ulong LatestBlockNumber,
    DateTimeOffset LatestBlockTime,
    RpcCompatibilityReport Compatibility,
    RpcCapability[] Capabilities
);
