using Farsight.Rpc.Api.Persistence.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Farsight.Rpc.Api.Persistence.Configurations;

internal sealed class WalletPrivateKeyGroupEFConfiguration : IEntityTypeConfiguration<WalletPrivateKeyGroup>
{
    public void Configure(EntityTypeBuilder<WalletPrivateKeyGroup> entity)
    {
        entity.HasKey(x => x.Id);
        entity.HasIndex(x => new { x.WalletId, x.Name }).IsUnique();

        entity.Property(x => x.Id);
        entity.Property(x => x.WalletId);
        entity.Property(x => x.Name)
            .UseCollation(AppDbContext.NAME_CASE_INSENSITIVE_COLLATION);
        entity.Property(x => x.Description);

        entity.ToTable("WalletPrivateKeyGroups");
    }
}
