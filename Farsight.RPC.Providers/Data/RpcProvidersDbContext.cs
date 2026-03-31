using Farsight.RPC.Providers.Data.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Farsight.RPC.Providers.Data;

public sealed class RpcProvidersDbContext(DbContextOptions<RpcProvidersDbContext> options) : DbContext(options)
{
    public DbSet<UserEntity> Users => Set<UserEntity>();

    public DbSet<RoleEntity> Roles => Set<RoleEntity>();

    public DbSet<UserRoleEntity> UserRoles => Set<UserRoleEntity>();

    public DbSet<ApiClientEntity> ApiClients => Set<ApiClientEntity>();

    public DbSet<RealTimeEndpointEntity> RealTimeEndpoints => Set<RealTimeEndpointEntity>();

    public DbSet<ArchiveEndpointEntity> ArchiveEndpoints => Set<ArchiveEndpointEntity>();

    public DbSet<TracingEndpointEntity> TracingEndpoints => Set<TracingEndpointEntity>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<UserEntity>(entity =>
        {
            entity.ToTable("users");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.UserName).HasMaxLength(200);
            entity.HasIndex(x => x.UserName).IsUnique();
        });

        modelBuilder.Entity<RoleEntity>(entity =>
        {
            entity.ToTable("roles");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Name).HasMaxLength(100);
            entity.HasIndex(x => x.Name).IsUnique();
        });

        modelBuilder.Entity<UserRoleEntity>(entity =>
        {
            entity.ToTable("user_roles");
            entity.HasKey(x => new { x.UserId, x.RoleId });
            entity.HasOne(x => x.User).WithMany(x => x.UserRoles).HasForeignKey(x => x.UserId);
            entity.HasOne(x => x.Role).WithMany(x => x.UserRoles).HasForeignKey(x => x.RoleId);
        });

        modelBuilder.Entity<ApiClientEntity>(entity =>
        {
            entity.ToTable("api_clients");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Name).HasMaxLength(200);
            entity.Property(x => x.ApiKeyHash).HasMaxLength(128);
            entity.HasIndex(x => x.Name).IsUnique();
            entity.HasIndex(x => x.ApiKeyHash).IsUnique();
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

    private static void ConfigureProviderEntity<TEntity>(ModelBuilder modelBuilder, string tableName, Action<EntityTypeBuilder<TEntity>>? extra = null)
        where TEntity : ProviderEndpointEntity
    {
        modelBuilder.Entity<TEntity>(entity =>
        {
            entity.ToTable(tableName);
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Application).HasMaxLength(200);
            entity.Property(x => x.Chain).HasMaxLength(100);
            entity.Property(x => x.Provider).HasMaxLength(200);
            entity.Property(x => x.Address).HasConversion(x => x.ToString(), x => new Uri(x)).HasMaxLength(2000);
            entity.HasIndex(x => new { x.Environment, x.Application, x.Chain, x.IsEnabled, x.Priority });
            entity.HasIndex(x => new { x.Application, x.Chain });
            entity.HasIndex(x => new { x.Chain, x.Provider });
            entity.HasIndex(x => new { x.Environment, x.Application, x.Chain, x.Provider, x.Address }).IsUnique();
            extra?.Invoke(entity);
        });
    }
}
