using Farsight.Rpc.Api.Persistence.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Farsight.Rpc.Api.Persistence.Configurations;

internal sealed class WalletEFConfiguration : IEntityTypeConfiguration<Wallet>
{
    public void Configure(EntityTypeBuilder<Wallet> entity)
    {
        entity.HasKey(x => x.Id);
        entity.HasIndex(x => x.Name).IsUnique();

        entity.Property(x => x.Id);
        entity.Property(x => x.Name)
            .UseCollation(AppDbContext.NAME_CASE_INSENSITIVE_COLLATION);
        entity.Property(x => x.Mnemonic);
        entity.Property(x => x.Color)
            .HasMaxLength(7)
            .HasDefaultValue("#6B7280");

        entity.HasMany(x => x.PrivateKeys)
            .WithOne(x => x.Wallet)
            .HasForeignKey(x => x.WalletId)
            .OnDelete(DeleteBehavior.Cascade);

        entity.HasMany(x => x.PrivateKeyGroups)
            .WithOne(x => x.Wallet)
            .HasForeignKey(x => x.WalletId)
            .OnDelete(DeleteBehavior.Cascade);

        entity.ToTable("Wallets");
    }
}
