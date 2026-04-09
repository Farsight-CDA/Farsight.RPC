namespace Farsight.Rpc.Api.Persistence.Entities.Rpc;

public sealed class ArchiveRpc : RpcEndpoint
{
    public ulong IndexerStepSize { get; set; }
    public ulong DexIndexerStepSize { get; set; }
    public ulong IndexerBlockOffset { get; set; }
}
