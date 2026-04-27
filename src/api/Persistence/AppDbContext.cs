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

    public DbSet<RpcEndpoint> Rpcs => Set<RpcEndpoint>();
    public DbSet<RpcEndpoint.Realtime> RealtimeRpcs => Set<RpcEndpoint.Realtime>();
    public DbSet<RpcEndpoint.Archive> ArchiveRpcs => Set<RpcEndpoint.Archive>();
    public DbSet<RpcEndpoint.Tracing> TracingRpcs => Set<RpcEndpoint.Tracing>();

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
