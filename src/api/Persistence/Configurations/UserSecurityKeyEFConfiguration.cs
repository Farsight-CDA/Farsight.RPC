using Farsight.Rpc.Api.Persistence.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Farsight.Rpc.Api.Persistence.Configurations;

internal sealed class UserSecurityKeyEFConfiguration : IEntityTypeConfiguration<UserSecurityKey>
{
    public void Configure(EntityTypeBuilder<UserSecurityKey> entity)
    {
        entity.HasKey(x => x.Id);
        entity.HasIndex(x => x.CredentialId).IsUnique();
        entity.HasIndex(x => x.Username);

        entity.Property(x => x.Username).HasMaxLength(200);
        entity.Property(x => x.Name).HasMaxLength(100);

        entity.ToTable("UserSecurityKeys");
    }
}
