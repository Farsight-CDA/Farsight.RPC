using Farsight.Rpc.Api.Persistence.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Farsight.Rpc.Api.Persistence.Configurations;

internal sealed class RpcErrorGroupEFConfiguration : IEntityTypeConfiguration<RpcErrorGroup>
{
    private static readonly ValueComparer<string[]> _errorsComparer = new(
        (left, right) => left != null && right != null && left.SequenceEqual(right),
        values => values.Aggregate(0, (hash, value) => HashCode.Combine(hash, value)),
        values => values.ToArray());

    public void Configure(EntityTypeBuilder<RpcErrorGroup> entity)
    {
        entity.HasKey(x => x.Id);

        entity.HasIndex(x => x.Name).IsUnique();

        entity.Property(x => x.Name)
            .UseCollation(AppDbContext.NAME_CASE_INSENSITIVE_COLLATION);

        entity.Property(x => x.Action)
            .HasConversion<string>();

        entity.Property(x => x.Errors)
            .HasColumnType("text[]")
            .Metadata.SetValueComparer(_errorsComparer);

        entity.ToTable("RpcErrorGroups");
    }
}
