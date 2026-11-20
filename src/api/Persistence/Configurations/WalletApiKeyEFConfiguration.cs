using Farsight.Rpc.Api.Persistence.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Farsight.Rpc.Api.Persistence.Configurations;

internal sealed class WalletApiKeyEFConfiguration : IEntityTypeConfiguration<WalletApiKey>
{
    public void Configure(EntityTypeBuilder<WalletApiKey> entity)
    {
        entity.HasKey(x => x.Id);
        entity.HasIndex(x => x.KeyHash).IsUnique();
        entity.HasIndex(x => x.WalletPrivateKeyId);

        entity.Property(x => x.Id);
        entity.Property(x => x.WalletPrivateKeyId);
        entity.Property(x => x.Name);
        entity.Property(x => x.KeyHash);
        entity.Property(x => x.LastUsedAt);

        entity.ToTable("WalletApiKeys");
    }
}
