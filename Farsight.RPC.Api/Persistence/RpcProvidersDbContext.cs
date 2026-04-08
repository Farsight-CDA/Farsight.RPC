using Farsight.Rpc.Api.Persistence.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Farsight.Rpc.Api.Persistence;

public sealed class RpcProvidersDbContext(DbContextOptions<RpcProvidersDbContext> options) : DbContext(options)
{
    public DbSet<ApiClientEntity> ApiClients => Set<ApiClientEntity>();
    public DbSet<ApplicationEntity> Applications => Set<ApplicationEntity>();
    public DbSet<ChainEntity> Chains => Set<ChainEntity>();
    public DbSet<ProviderEntity> Providers => Set<ProviderEntity>();
    public DbSet<ProviderRateLimitEntity> ProviderRateLimits => Set<ProviderRateLimitEntity>();
    public DbSet<RealTimeEndpointEntity> RealTimeEndpoints => Set<RealTimeEndpointEntity>();
    public DbSet<ArchiveEndpointEntity> ArchiveEndpoints => Set<ArchiveEndpointEntity>();
    public DbSet<TracingEndpointEntity> TracingEndpoints => Set<TracingEndpointEntity>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasPostgresExtension("citext");

        modelBuilder.Entity<ApiClientEntity>(entity =>
        {
            entity.ToTable("api_clients");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.ApiKey).HasMaxLength(200);
            entity.HasIndex(x => x.ApiKey).IsUnique();
            entity.HasOne(x => x.Application).WithMany().HasForeignKey(x => x.ApplicationId).OnDelete(DeleteBehavior.Restrict);
        });

        ConfigureLookupEntity<ApplicationEntity>(modelBuilder, "applications");
        ConfigureLookupEntity<ChainEntity>(modelBuilder, "chains");
        ConfigureLookupEntity<ProviderEntity>(modelBuilder, "providers");

        modelBuilder.Entity<ProviderRateLimitEntity>(entity =>
        {
            entity.ToTable("provider_rate_limits", tableBuilder =>
            {
                tableBuilder.HasCheckConstraint("CK_provider_rate_limits_RateLimit_Positive", "\"RateLimit\" > 0");
            });
            entity.HasKey(x => x.ProviderId);
            entity.HasOne(x => x.Provider).WithOne().HasForeignKey<ProviderRateLimitEntity>(x => x.ProviderId).OnDelete(DeleteBehavior.Cascade);
        });

        ConfigureProviderEntity<RealTimeEndpointEntity>(modelBuilder, "rpc_realtime_endpoints");
        ConfigureProviderEntity<ArchiveEndpointEntity>(modelBuilder, "rpc_archive_endpoints", entity =>
        {
            entity.Property(x => x.IndexerStepSize);
            entity.Property(x => x.DexIndexStepSize);
            entity.Property(x => x.IndexBlockOffset);
        });
        ConfigureProviderEntity<TracingEndpointEntity>(modelBuilder, "rpc_tracing_endpoints", entity =>
        {
            entity.Property(x => x.TracingMode).HasConversion<string>().HasMaxLength(50);
        });
    }

    private static void ConfigureLookupEntity<TEntity>(ModelBuilder modelBuilder, string tableName)
        where TEntity : class
    {
        modelBuilder.Entity<TEntity>(entity =>
        {
            entity.ToTable(tableName, tableBuilder =>
            {
                tableBuilder.HasCheckConstraint($"CK_{tableName}_Name_NotEmpty", "btrim(\"Name\") <> ''");
            });
            entity.Property<Guid>("Id");
            entity.Property<string>("Name").HasColumnType("citext");
            entity.HasKey("Id");
            entity.HasIndex("Name").IsUnique();
        });
    }

    private static void ConfigureProviderEntity<TEntity>(ModelBuilder modelBuilder, string tableName, Action<EntityTypeBuilder<TEntity>>? extra = null)
        where TEntity : ProviderEndpointEntity
    {
        modelBuilder.Entity<TEntity>(entity =>
        {
            entity.ToTable(tableName, tableBuilder =>
            {
                tableBuilder.HasCheckConstraint($"CK_{tableName}_Address_Scheme", "\"Address\" ~* '^(http|https|ws|wss)://'");
            });
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Address).HasConversion(x => x.ToString(), x => new Uri(x)).HasMaxLength(2000);
            entity.HasOne(x => x.Application).WithMany().HasForeignKey(x => x.ApplicationId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(x => x.Chain).WithMany().HasForeignKey(x => x.ChainId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(x => x.Provider).WithMany().HasForeignKey(x => x.ProviderId).OnDelete(DeleteBehavior.Restrict);
            entity.HasIndex(x => new { x.ApplicationId, x.Environment, x.ChainId });
            extra?.Invoke(entity);
        });
    }
}
