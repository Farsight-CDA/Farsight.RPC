using Farsight.Rpc.Api.Persistence.Entities.Rpc;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Farsight.Rpc.Api.Persistence.Configurations.Rpc;

internal sealed class ArchiveRpcEFConfiguration : IEntityTypeConfiguration<ArchiveRpc>
{
    public void Configure(EntityTypeBuilder<ArchiveRpc> entity)
    {
        entity.Property(x => x.IndexerStepSize);
        entity.Property(x => x.DexIndexerStepSize);
        entity.Property(x => x.IndexerBlockOffset);
    }
}
