using Farsight.Rpc.Api.Persistence.Entities;
using Farsight.Rpc.Types;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Farsight.Rpc.Api.Persistence.Configurations;

internal sealed class ConsumerApplicationEFConfiguration : IEntityTypeConfiguration<ConsumerApplication>
{
    private static readonly ValueComparer<RpcStructureType[]> _structuresComparer = new(
        (left, right) => left != null && right != null && left.SequenceEqual(right),
        values => values.Aggregate(0, (hash, value) => HashCode.Combine(hash, value)),
        values => values.ToArray());

    public void Configure(EntityTypeBuilder<ConsumerApplication> entity)
    {
        entity.HasKey(x => x.Id);
        entity.HasIndex(x => x.Name).IsUnique();

        entity.Property(x => x.Id);

        entity.Property(x => x.Name)
            .UseCollation(AppDbContext.NAME_CASE_INSENSITIVE_COLLATION);

        entity.Property(x => x.Structures)
            .HasConversion(
                values => values.Select(value => value.ToString()).ToArray(),
                values => values.Select(Enum.Parse<RpcStructureType>).ToArray(),
                _structuresComparer)
            .HasColumnType("text[]");

        entity.HasMany(x => x.ApiKeys)
            .WithOne(x => x.Application)
            .HasForeignKey(x => x.ApplicationId);

        entity.HasMany(x => x.Environments)
            .WithOne(x => x.Application)
            .HasForeignKey(x => x.ApplicationId);

        entity.HasMany(x => x.Rpcs)
            .WithOne(x => x.Application)
            .HasForeignKey(x => x.ApplicationId);

        entity.ToTable("ConsumerApplications");
    }
}
