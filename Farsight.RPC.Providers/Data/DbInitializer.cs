using Farsight.Common;
using Farsight.RPC.Providers.Auth;
using Farsight.RPC.Providers.Data.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Farsight.RPC.Providers.Data;

public partial class DbInitializer : Singleton
{
    [Inject] private readonly IDbContextFactory<RpcProvidersDbContext> _dbContextFactory;
    [Inject] private readonly BootstrapAdminOptions _adminOptions;
    [Inject] private readonly BootstrapViewerClientOptions _viewerClientOptions;

    protected override async Task InitializeAsync(CancellationToken cancellationToken)
    {
        await using var dbContext = await _dbContextFactory.CreateDbContextAsync(cancellationToken);
        await dbContext.Database.MigrateAsync(cancellationToken);
        await SeedRolesAsync(dbContext, cancellationToken);
        await SeedAdminAsync(dbContext, cancellationToken);
        await SeedViewerClientAsync(dbContext, cancellationToken);
    }

    private static async Task SeedRolesAsync(RpcProvidersDbContext dbContext, CancellationToken cancellationToken)
    {
        if (!await dbContext.Roles.AnyAsync(cancellationToken))
        {
            dbContext.Roles.AddRange(
                new RoleEntity { Id = Guid.NewGuid(), Name = AppRoles.Admin },
                new RoleEntity { Id = Guid.NewGuid(), Name = AppRoles.Viewer });
            await dbContext.SaveChangesAsync(cancellationToken);
        }
    }

    private async Task SeedAdminAsync(RpcProvidersDbContext dbContext, CancellationToken cancellationToken)
    {
        if (await dbContext.Users.AnyAsync(cancellationToken))
        {
            return;
        }

        var adminRole = await dbContext.Roles.SingleAsync(x => x.Name == AppRoles.Admin, cancellationToken);
        var user = new UserEntity
        {
            Id = Guid.NewGuid(),
            UserName = _adminOptions.UserName,
            IsEnabled = true
        };
        user.PasswordHash = new PasswordHasher<UserEntity>().HashPassword(user, _adminOptions.Password);
        user.UserRoles.Add(new UserRoleEntity
        {
            UserId = user.Id,
            RoleId = adminRole.Id,
            User = user,
            Role = adminRole
        });

        dbContext.Users.Add(user);
        await dbContext.SaveChangesAsync(cancellationToken);
        _logger.LogInformation("Bootstrapped admin user '{UserName}'.", user.UserName);
    }

    private async Task SeedViewerClientAsync(RpcProvidersDbContext dbContext, CancellationToken cancellationToken)
    {
        if (await dbContext.ApiClients.AnyAsync(cancellationToken))
        {
            return;
        }

        var now = DateTimeOffset.UtcNow;
        dbContext.ApiClients.Add(new ApiClientEntity
        {
            Id = Guid.NewGuid(),
            Name = _viewerClientOptions.Name,
            ApiKeyHash = SecretHasher.Hash(_viewerClientOptions.ApiKey),
            IsEnabled = true,
            CreatedUtc = now,
            UpdatedUtc = now
        });
        await dbContext.SaveChangesAsync(cancellationToken);
        _logger.LogInformation("Bootstrapped viewer API client '{ClientName}'.", _viewerClientOptions.Name);
    }
}
