namespace Farsight.RPC.Providers.Data.Entities;

public sealed class ArchiveEndpointEntity : ProviderEndpointEntity
{
    public ulong IndexerStepSize { get; set; }

    public ulong? DexIndexStepSize { get; set; }

    public ulong IndexBlockOffset { get; set; }
}
