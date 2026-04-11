using Farsight.Rpc.Api.Persistence.Entities.Rpc;
using Farsight.Rpc.Types;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Farsight.Rpc.Api.Persistence.Configurations.Rpc;

internal sealed class RpcEFConfiguration : IEntityTypeConfiguration<RpcEndpoint>
{
    public void Configure(EntityTypeBuilder<RpcEndpoint> entity)
    {
        entity.HasKey(x => x.Id);
        entity.HasIndex(x => new { x.ApplicationId, x.EnvironmentId });
        entity.HasIndex(x => x.ProviderId);
        entity.HasIndex(x => x.EnvironmentId);

        entity.Property(x => x.Id);

        entity.Property(x => x.EnvironmentId);
        entity.Property(x => x.Chain)
            .HasMaxLength(30);

        entity.Property(x => x.Address);

        entity.Property(x => x.ApplicationId);
        entity.Property(x => x.ProviderId);

        entity.HasDiscriminator<string>("RpcType")
            .HasValue<RpcEndpoint.Realtime>(nameof(RpcType.Realtime))
            .HasValue<RpcEndpoint.Archive>(nameof(RpcType.Archive))
            .HasValue<RpcEndpoint.Tracing>(nameof(RpcType.Tracing));

        entity.ToTable("Rpcs");
    }
}
