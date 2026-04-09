using Farsight.Rpc.Api.Persistence.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Farsight.Rpc.Api.Persistence.Configurations;

internal sealed class ChainEntityConfiguration : IEntityTypeConfiguration<ChainEntity>
{
    public void Configure(EntityTypeBuilder<ChainEntity> entity)
    {
        entity.HasKey(x => x.Id);

        entity.Property(x => x.Id)
            .IsRequired()
            .ValueGeneratedNever();

        entity.Property(x => x.Name)
            .IsRequired()
            .HasColumnType("citext");

        entity.HasIndex(x => x.Name)
            .IsUnique();

        entity.ToTable("chains", tableBuilder =>
        {
            tableBuilder.HasCheckConstraint("CK_chains_Name_NotEmpty", "btrim(\"Name\") <> ''");
        });
    }
}
