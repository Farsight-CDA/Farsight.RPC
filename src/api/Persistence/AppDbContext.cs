using Farsight.Rpc.Api.Persistence.Entities;
using Farsight.Rpc.Api.Persistence.Entities.Rpc;
using Microsoft.EntityFrameworkCore;

namespace Farsight.Rpc.Api.Persistence;

public sealed class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public const string NAME_CASE_INSENSITIVE_COLLATION = "name_case_insensitive";

    public DbSet<ApplicationEnvironment> ApplicationEnvironments => Set<ApplicationEnvironment>();
    public DbSet<ConsumerApplication> ConsumerApplications => Set<ConsumerApplication>();
    public DbSet<ConsumerApiKey> ConsumerApiKeys => Set<ConsumerApiKey>();
    public DbSet<RpcErrorGroup> RpcErrorGroups => Set<RpcErrorGroup>();
    public DbSet<RpcProvider> RpcProviders => Set<RpcProvider>();
    public DbSet<SecurityKeyChallenge> SecurityKeyChallenges => Set<SecurityKeyChallenge>();
    public DbSet<SecurityKeyChallenge.Login> SecurityKeyLoginChallenges => Set<SecurityKeyChallenge.Login>();
    public DbSet<SecurityKeyChallenge.Registration> SecurityKeyRegistrationChallenges => Set<SecurityKeyChallenge.Registration>();
    public DbSet<UserSecurityKey> UserSecurityKeys => Set<UserSecurityKey>();
    public DbSet<Wallet> Wallets => Set<Wallet>();
    public DbSet<WalletApiKey> WalletApiKeys => Set<WalletApiKey>();
    public DbSet<WalletPrivateKey> WalletPrivateKeys => Set<WalletPrivateKey>();

    public DbSet<RpcEndpoint> Rpcs => Set<RpcEndpoint>();
    public DbSet<RpcRule> RpcRules => Set<RpcRule>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasCollation(
            NAME_CASE_INSENSITIVE_COLLATION,
            locale: "und-u-ks-level2",
            provider: "icu",
            deterministic: false);

        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
    }
}
