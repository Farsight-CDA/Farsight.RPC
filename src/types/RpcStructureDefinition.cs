using System.Collections.Frozen;

namespace Farsight.Rpc.Types;

public sealed record RpcStructureDefinition(
    RpcStructureType Structure,
    Dictionary<RpcType, int> RequiredRpcTypes
)
{
    public static FrozenDictionary<RpcStructureType, RpcStructureDefinition> All { get; } = new Dictionary<RpcStructureType, RpcStructureDefinition>()
    {
        [RpcStructureType.Basic] = new RpcStructureDefinition(
            RpcStructureType.Basic,
            new Dictionary<RpcType, int> { [RpcType.Realtime] = 1 }
        ),
        [RpcStructureType.RoleSplit] = new RpcStructureDefinition(
            RpcStructureType.RoleSplit,
            new Dictionary<RpcType, int>
            {
                [RpcType.Realtime] = 1,
                [RpcType.Archive] = 1,
                [RpcType.Tracing] = 1
            }
        ),
    }.ToFrozenDictionary();
}
