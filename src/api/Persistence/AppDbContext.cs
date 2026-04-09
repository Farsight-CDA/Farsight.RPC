using Farsight.Rpc.Api.Persistence.Entities;
using Farsight.Rpc.Api.Persistence.Entities.Rpc;
using Microsoft.EntityFrameworkCore;

namespace Farsight.Rpc.Api.Persistence;

public sealed class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<ConsumerApplication> ConsumerApplications => Set<ConsumerApplication>();
    public DbSet<RpcProvider> RpcProviders => Set<RpcProvider>();

    public DbSet<RealtimeRpc> RealtimeRpcs => Set<RealtimeRpc>();
    public DbSet<ArchiveRpc> ArchiveRpcs => Set<ArchiveRpc>();
    public DbSet<TracingRpc> TracingRpcs => Set<TracingRpc>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
        => modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
}
