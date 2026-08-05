using System.Text.Json.Serialization;

namespace Farsight.Rpc.Types;

public sealed record RpcProbeResult(
    ulong ChainId,
    ulong LatestBlockNumber,
    DateTimeOffset LatestBlockTime,
    RpcCompatibilityReport Compatibility,
    RpcCapability[] Capabilities,
    [property: JsonIgnore(Condition = JsonIgnoreCondition.Never)] ulong? EthGetLogsLimit,
    [property: JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)] RpcCapabilityError[]? Errors
);
