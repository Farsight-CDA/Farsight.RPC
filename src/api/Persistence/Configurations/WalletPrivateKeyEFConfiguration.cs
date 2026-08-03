using Farsight.Rpc.Api.Persistence.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Farsight.Rpc.Api.Persistence.Configurations;

internal sealed class WalletPrivateKeyEFConfiguration : IEntityTypeConfiguration<WalletPrivateKey>
{
    public void Configure(EntityTypeBuilder<WalletPrivateKey> entity)
    {
        entity.HasKey(x => x.Id);
        entity.HasIndex(x => new { x.WalletId, x.Curve, x.DerivationPath }).IsUnique();

        entity.Property(x => x.Id);
        entity.Property(x => x.WalletId);
        entity.Property(x => x.Curve)
            .HasConversion<string>();
        entity.Property(x => x.DerivationPath);
        entity.Property(x => x.AddressFormat)
            .HasConversion<string>();
        entity.Property(x => x.PublicKey);

        entity.HasMany(x => x.ApiKeys)
            .WithOne(x => x.WalletPrivateKey)
            .HasForeignKey(x => x.WalletPrivateKeyId)
            .OnDelete(DeleteBehavior.Cascade);

        entity.ToTable("WalletPrivateKeys");
    }
}
