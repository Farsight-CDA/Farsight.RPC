using Farsight.Rpc.Api.Persistence.Entities.Rpc;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Farsight.Rpc.Api.Persistence.Configurations.Rpc;

internal sealed class TracingRpcEFConfiguration : IEntityTypeConfiguration<TracingRpc>
{
    public void Configure(EntityTypeBuilder<TracingRpc> entity)
    {
        entity.HasKey(x => x.Id);
        entity.HasIndex(x => new { x.ApplicationId, x.Environment });

        entity.Property(x => x.Id);

        entity.Property(x => x.Environment);
        entity.Property(x => x.Chain)
            .HasMaxLength(30);

        entity.Property(x => x.Address);

        entity.Property(x => x.ApplicationId);
        entity.Property(x => x.ProviderId);

        entity.Property(x => x.TracingMode);

        entity.ToTable("TracingRpcs");
    }
}
