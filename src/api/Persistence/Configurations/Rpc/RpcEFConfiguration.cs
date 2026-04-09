using Farsight.Rpc.Api.Persistence.Entities.Rpc;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Farsight.Rpc.Api.Persistence.Configurations.Rpc;

internal sealed class RpcEFConfiguration : IEntityTypeConfiguration<RpcEndpoint>
{
    public void Configure(EntityTypeBuilder<RpcEndpoint> entity)
    {
        entity.HasKey(x => x.Id);
        entity.HasIndex(x => new { x.ApplicationId, x.Environment });
        entity.HasIndex(x => x.ProviderId);

        entity.Property(x => x.Id);

        entity.Property(x => x.Environment);
        entity.Property(x => x.Chain)
            .HasMaxLength(30);

        entity.Property(x => x.Address);

        entity.Property(x => x.ApplicationId);
        entity.Property(x => x.ProviderId);

        entity.HasDiscriminator<string>("RpcType")
            .HasValue<RealtimeRpc>("Realtime")
            .HasValue<ArchiveRpc>("Archive")
            .HasValue<TracingRpc>("Tracing");

        entity.ToTable("Rpcs");
    }
}
