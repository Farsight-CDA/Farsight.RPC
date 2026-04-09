using Farsight.Rpc.Api.Persistence.Entities;
using Microsoft.EntityFrameworkCore;

namespace Farsight.Rpc.Api.Persistence;

public sealed class RpcProvidersDbContext(DbContextOptions<RpcProvidersDbContext> options) : DbContext(options)
{
    public DbSet<ApiClientEntity> ApiClients => Set<ApiClientEntity>();
    public DbSet<ApplicationEntity> Applications => Set<ApplicationEntity>();
    public DbSet<ProviderEntity> Providers => Set<ProviderEntity>();
    public DbSet<RealTimeEndpointEntity> RealTimeEndpoints => Set<RealTimeEndpointEntity>();
    public DbSet<ArchiveEndpointEntity> ArchiveEndpoints => Set<ArchiveEndpointEntity>();
    public DbSet<TracingEndpointEntity> TracingEndpoints => Set<TracingEndpointEntity>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasPostgresExtension("citext");
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(RpcProvidersDbContext).Assembly);
    }
}
