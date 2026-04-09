using Farsight.Rpc.Api.Persistence.Entities.Rpc;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Farsight.Rpc.Api.Persistence.Configurations.Rpc;

internal sealed class ArchiveRpcEFConfiguration : IEntityTypeConfiguration<RpcEndpoint.Archive>
{
    public void Configure(EntityTypeBuilder<RpcEndpoint.Archive> entity)
    {
        entity.Property(x => x.IndexerStepSize);
        entity.Property(x => x.DexIndexerStepSize);
        entity.Property(x => x.IndexerBlockOffset);
    }
}
