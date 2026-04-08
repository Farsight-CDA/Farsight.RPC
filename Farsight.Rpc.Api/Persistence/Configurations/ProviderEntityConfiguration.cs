using Farsight.Rpc.Api.Persistence.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Farsight.Rpc.Api.Persistence.Configurations;

internal sealed class ProviderEntityConfiguration : IEntityTypeConfiguration<ProviderEntity>
{
    public void Configure(EntityTypeBuilder<ProviderEntity> entity)
    {
        entity.HasKey(x => x.Id);

        entity.Property(x => x.Id)
            .IsRequired()
            .ValueGeneratedNever();

        entity.Property(x => x.Name)
            .IsRequired()
            .HasColumnType("citext");

        entity.Property(x => x.RateLimit)
            .IsRequired();

        entity.HasIndex(x => x.Name)
            .IsUnique();

        entity.ToTable("providers", tableBuilder =>
        {
            tableBuilder.HasCheckConstraint("CK_providers_Name_NotEmpty", "btrim(\"Name\") <> ''");
            tableBuilder.HasCheckConstraint("CK_providers_RateLimit_Positive", "\"RateLimit\" > 0");
        });
    }
}
