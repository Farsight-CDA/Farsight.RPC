using Farsight.Rpc.Api.Persistence.Entities;
using Farsight.Rpc.Api.Persistence.Entities.Rpc;
using Microsoft.EntityFrameworkCore;

namespace Farsight.Rpc.Api.Persistence;

public sealed class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public const string NAME_CASE_INSENSITIVE_COLLATION = "name_case_insensitive";

    public DbSet<ConsumerApplication> ConsumerApplications => Set<ConsumerApplication>();
    public DbSet<ConsumerApiKey> ConsumerApiKeys => Set<ConsumerApiKey>();
    public DbSet<RpcProvider> RpcProviders => Set<RpcProvider>();

    public DbSet<RpcEndpoint> Rpcs => Set<RpcEndpoint>();
    public DbSet<RealtimeRpc> RealtimeRpcs => Set<RealtimeRpc>();
    public DbSet<ArchiveRpc> ArchiveRpcs => Set<ArchiveRpc>();
    public DbSet<TracingRpc> TracingRpcs => Set<TracingRpc>();

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
