using Farsight.Rpc.Api.Persistence.Entities;
using Fido2NetLib;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Farsight.Rpc.Api.Persistence.Configurations;

internal sealed class SecurityKeyChallengeEFConfiguration : IEntityTypeConfiguration<SecurityKeyChallenge>
{
    public void Configure(EntityTypeBuilder<SecurityKeyChallenge> entity)
    {
        entity.HasKey(x => x.Id);
        entity.HasIndex(x => x.ExpiresAt);

        entity.Property(x => x.Username).HasMaxLength(200);

        entity.HasDiscriminator<string>("ChallengeType")
            .HasValue<SecurityKeyChallenge.Login>(nameof(SecurityKeyChallenge.Login))
            .HasValue<SecurityKeyChallenge.Registration>(nameof(SecurityKeyChallenge.Registration));
        entity.Property<string>("ChallengeType").HasMaxLength(20);

        entity.ToTable("SecurityKeyChallenges");
    }
}

internal sealed class LoginSecurityKeyChallengeEFConfiguration : IEntityTypeConfiguration<SecurityKeyChallenge.Login>
{
    public void Configure(EntityTypeBuilder<SecurityKeyChallenge.Login> entity)
        => entity.Property(x => x.Options)
            .HasConversion(options => options.ToJson(), json => AssertionOptions.FromJson(json))
            .HasColumnName("AssertionOptions")
            .HasColumnType("jsonb");
}

internal sealed class RegistrationSecurityKeyChallengeEFConfiguration : IEntityTypeConfiguration<SecurityKeyChallenge.Registration>
{
    public void Configure(EntityTypeBuilder<SecurityKeyChallenge.Registration> entity)
    {
        entity.Property(x => x.KeyName).HasMaxLength(100);
        entity.Property(x => x.Options)
            .HasConversion(options => options.ToJson(), json => CredentialCreateOptions.FromJson(json))
            .HasColumnName("CredentialCreateOptions")
            .HasColumnType("jsonb");
    }
}
