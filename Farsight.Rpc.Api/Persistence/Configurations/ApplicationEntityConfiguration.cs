using Farsight.Rpc.Api.Persistence.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Farsight.Rpc.Api.Persistence.Configurations;

internal sealed class ApplicationEntityConfiguration : IEntityTypeConfiguration<ApplicationEntity>
{
    public void Configure(EntityTypeBuilder<ApplicationEntity> entity)
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

        entity.ToTable("applications", tableBuilder =>
        {
            tableBuilder.HasCheckConstraint("CK_applications_Name_NotEmpty", "btrim(\"Name\") <> ''");
        });
    }
}
