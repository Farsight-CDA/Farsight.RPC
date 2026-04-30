namespace Farsight.Rpc.Types;

public sealed record RpcStructureDefinition(
    RpcTypeRequirement Realtime,
    RpcTypeRequirement Archive,
    RpcTypeRequirement Tracing
)
{
    public static RpcStructureDefinition Default { get; } = new(
        new RpcTypeRequirement(RpcRequirementMode.Fixed, 0, null, null),
        new RpcTypeRequirement(RpcRequirementMode.Fixed, 0, null, null),
        new RpcTypeRequirement(RpcRequirementMode.Fixed, 0, null, null)
    );
}
