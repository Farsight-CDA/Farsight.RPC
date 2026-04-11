using Farsight.Rpc.Api.Persistence.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Farsight.Rpc.Api.Persistence.Configurations;

internal sealed class ApplicationEnvironmentEFConfiguration : IEntityTypeConfiguration<ApplicationEnvironment>
{
    public void Configure(EntityTypeBuilder<ApplicationEnvironment> entity)
    {
        entity.HasKey(x => x.Id);
        entity.HasIndex(x => new { x.ApplicationId, x.Name }).IsUnique();

        entity.Property(x => x.Id);
        entity.Property(x => x.ApplicationId);

        entity.Property(x => x.Name)
            .UseCollation(AppDbContext.NAME_CASE_INSENSITIVE_COLLATION);

        entity.HasOne(x => x.Application)
            .WithMany(x => x.Environments)
            .HasForeignKey(x => x.ApplicationId);

        entity.HasMany(x => x.ApiKeys)
            .WithOne(x => x.Environment)
            .HasForeignKey(x => x.EnvironmentId);

        entity.HasMany(x => x.Rpcs)
            .WithOne(x => x.Environment)
            .HasForeignKey(x => x.EnvironmentId);

        entity.ToTable("ApplicationEnvironments");
    }
}
