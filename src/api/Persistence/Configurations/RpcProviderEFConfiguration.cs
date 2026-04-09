using Farsight.Rpc.Api.Persistence.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Farsight.Rpc.Api.Persistence.Configurations;

internal sealed class RpcProviderEFConfiguration : IEntityTypeConfiguration<RpcProvider>
{
    public void Configure(EntityTypeBuilder<RpcProvider> entity)
    {
        entity.HasKey(x => x.Id);
        entity.HasIndex(x => x.Name).IsUnique();

        entity.Property(x => x.Id);

        entity.Property(x => x.Name);
        entity.Property(x => x.RateLimit);

        entity.ToTable("RpcProviders");
    }
}
