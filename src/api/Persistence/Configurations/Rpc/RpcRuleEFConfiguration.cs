using Farsight.Rpc.Api.Persistence.Entities.Rpc;
using Farsight.Rpc.Types;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Farsight.Rpc.Api.Persistence.Configurations.Rpc;

internal sealed class RpcRuleEFConfiguration : IEntityTypeConfiguration<RpcRule>
{
    private static readonly ValueComparer<string[]> _chainsComparer = new(
        (left, right) => left != null && right != null && left.SequenceEqual(right),
        values => values.Aggregate(0, (hash, value) => HashCode.Combine(hash, value)),
        values => values.ToArray());

    private static readonly ValueComparer<RpcCapability[]> _capabilitiesComparer = new(
        (left, right) => left != null && right != null && left.SequenceEqual(right),
        values => values.Aggregate(0, (hash, value) => HashCode.Combine(hash, value)),
        values => values.ToArray());

    public void Configure(EntityTypeBuilder<RpcRule> entity)
    {
        entity.HasKey(x => x.Id);
        entity.HasIndex(x => x.EnvironmentId);
        entity.HasIndex(x => new { x.ApplicationId, x.EnvironmentId });

        entity.Property(x => x.Id);
        entity.Property(x => x.ApplicationId);
        entity.Property(x => x.EnvironmentId);
        entity.Property(x => x.Chains)
            .HasColumnType("text[]")
            .Metadata.SetValueComparer(_chainsComparer);
        entity.Property(x => x.AllOf)
            .HasColumnType("integer[]")
            .Metadata.SetValueComparer(_capabilitiesComparer);
        entity.Property(x => x.AnyOf)
            .HasColumnType("integer[]")
            .Metadata.SetValueComparer(_capabilitiesComparer);
        entity.Property(x => x.Severity);

        entity.ToTable("RpcRules");
    }
}
