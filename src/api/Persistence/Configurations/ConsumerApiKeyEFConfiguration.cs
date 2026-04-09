using Farsight.Rpc.Api.Persistence.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Farsight.Rpc.Api.Persistence.Configurations;

internal sealed class ConsumerApiKeyEFConfiguration : IEntityTypeConfiguration<ConsumerApiKey>
{
    public void Configure(EntityTypeBuilder<ConsumerApiKey> entity)
    {
        entity.HasKey(x => x.Id);
        entity.HasIndex(x => new { x.ApplicationId, x.Environment });

        entity.Property(x => x.Id);

        entity.Property(x => x.Environment);
        entity.Property(x => x.ApplicationId);
        entity.Property(x => x.Key);

        entity.ToTable("ConsumerApiKeys");
    }
}
