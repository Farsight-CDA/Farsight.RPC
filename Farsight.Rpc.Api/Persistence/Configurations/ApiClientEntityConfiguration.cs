using Farsight.Rpc.Api.Persistence.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Farsight.Rpc.Api.Persistence.Configurations;

internal sealed class ApiClientEntityConfiguration : IEntityTypeConfiguration<ApiClientEntity>
{
    public void Configure(EntityTypeBuilder<ApiClientEntity> entity)
    {
        entity.HasKey(x => x.Id);

        entity.Property(x => x.Id)
            .IsRequired()
            .ValueGeneratedNever();

        entity.Property(x => x.ApiKey)
            .IsRequired()
            .HasMaxLength(200);

        entity.Property(x => x.ApplicationId)
            .IsRequired(false);

        entity.Property(x => x.Environment)
            .IsRequired(false);

        entity.Property(x => x.IsEnabled)
            .IsRequired();

        entity.Property(x => x.CreatedUtc)
            .IsRequired();

        entity.Property(x => x.UpdatedUtc)
            .IsRequired();

        entity.HasIndex(x => x.ApiKey)
            .IsUnique();

        entity.HasOne(x => x.Application)
            .WithMany()
            .HasForeignKey(x => x.ApplicationId)
            .OnDelete(DeleteBehavior.Restrict)
            .IsRequired(false);

        entity.ToTable("api_clients");
    }
}
