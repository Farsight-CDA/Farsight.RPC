using Farsight.Rpc.Api.Persistence.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Farsight.Rpc.Api.Persistence.Configurations;

internal sealed class ConsumerApplicationEFConfiguration : IEntityTypeConfiguration<ConsumerApplication>
{
    public void Configure(EntityTypeBuilder<ConsumerApplication> entity)
    {
        entity.HasKey(x => x.Id);
        entity.HasIndex(x => x.Name).IsUnique();

        entity.Property(x => x.Id);

        entity.Property(x => x.Name);

        entity.ToTable("ConsumerApplications");
    }
}
