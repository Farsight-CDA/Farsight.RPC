using System.Collections.Frozen;

namespace Farsight.Rpc.Types;

public sealed record RpcStructureDefinition(
    RpcStructureType Structure,
    string DisplayName,
    Dictionary<RpcType, int> RequiredRpcTypes
)
{
    public static FrozenDictionary<RpcStructureType, RpcStructureDefinition> All { get; } = new Dictionary<RpcStructureType, RpcStructureDefinition>()
    {
        [RpcStructureType.RealtimeOnly] = new RpcStructureDefinition(
            RpcStructureType.RealtimeOnly,
            "RT",
            new Dictionary<RpcType, int> { [RpcType.Realtime] = 1 }
        ),
        [RpcStructureType.RealtimeArchive] = new RpcStructureDefinition(
            RpcStructureType.RealtimeArchive,
            "RT+AR",
            new Dictionary<RpcType, int>
            {
                [RpcType.Realtime] = 1,
                [RpcType.Archive] = 1
            }
        ),
        [RpcStructureType.RealtimeArchiveTracing] = new RpcStructureDefinition(
            RpcStructureType.RealtimeArchiveTracing,
            "RT+AR+TR",
            new Dictionary<RpcType, int>
            {
                [RpcType.Realtime] = 1,
                [RpcType.Archive] = 1,
                [RpcType.Tracing] = 1
            }
        ),
    }.ToFrozenDictionary();
}
