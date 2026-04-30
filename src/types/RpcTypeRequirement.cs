namespace Farsight.Rpc.Types;

public sealed record RpcTypeRequirement(
    RpcRequirementMode Mode,
    int? Count,
    int? Min,
    int? Max
);
