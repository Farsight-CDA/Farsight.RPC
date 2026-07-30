using Farsight.Rpc.Api.Persistence.Entities.Rpc;
using Farsight.Rpc.Types;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Farsight.Rpc.Api.Persistence.Configurations.Rpc;

internal sealed class RpcEFConfiguration : IEntityTypeConfiguration<RpcEndpoint>
{
    private static readonly ValueComparer<RpcCapability[]> _capabilitiesComparer = new(
        (left, right) => left != null && right != null && left.SequenceEqual(right),
        values => values.Aggregate(0, (hash, value) => HashCode.Combine(hash, value)),
        values => values.ToArray());

    public void Configure(EntityTypeBuilder<RpcEndpoint> entity)
    {
        entity.HasKey(x => x.Id);
        entity.HasIndex(x => new { x.ApplicationId, x.EnvironmentId });
        entity.HasIndex(x => x.ProviderId);
        entity.HasIndex(x => x.EnvironmentId);
        entity.HasIndex(x => new { x.ApplicationId, x.EnvironmentId, x.Chain, x.Address }).IsUnique();
        entity.HasIndex(x => new { x.ApplicationId, x.EnvironmentId, x.Chain, x.Order }).IsUnique();

        entity.Property(x => x.Id);

        entity.Property(x => x.EnvironmentId);
        entity.Property(x => x.Chain)
            .HasMaxLength(30);

        entity.Property(x => x.Address);

        entity.Property(x => x.ApplicationId);
        entity.Property(x => x.ProviderId);
        entity.Property(x => x.Capabilities)
            .HasColumnType("integer[]")
            .HasDefaultValue(Array.Empty<RpcCapability>())
            .Metadata.SetValueComparer(_capabilitiesComparer);
        entity.Property(x => x.EthGetLogsLimit);
        entity.Property(x => x.Order);

        entity.ToTable("Rpcs");
    }
}
