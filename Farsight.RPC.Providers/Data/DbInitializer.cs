using Farsight.RPC.Providers.Auth;
using Farsight.RPC.Providers.Data.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace Farsight.RPC.Providers.Data;

public sealed class DbInitializer(
    RpcProvidersDbContext dbContext,
    IOptions<BootstrapAdminOptions> adminOptions,
    IOptions<BootstrapViewerClientOptions> viewerClientOptions)
{
    public async Task InitializeAsync(IHostEnvironment environment, ILogger logger, CancellationToken cancellationToken)
    {
        if (environment.IsDevelopment())
        {
            await dbContext.Database.MigrateAsync(cancellationToken);
        }

        await SeedRolesAsync(cancellationToken);
        await SeedAdminAsync(logger, cancellationToken);
        await SeedViewerClientAsync(logger, cancellationToken);
    }

    private async Task SeedRolesAsync(CancellationToken cancellationToken)
    {
        if (!await dbContext.Roles.AnyAsync(cancellationToken))
        {
            dbContext.Roles.AddRange(
                new RoleEntity { Id = Guid.NewGuid(), Name = AppRoles.Admin },
                new RoleEntity { Id = Guid.NewGuid(), Name = AppRoles.Viewer });
            await dbContext.SaveChangesAsync(cancellationToken);
        }
    }

    private async Task SeedAdminAsync(ILogger logger, CancellationToken cancellationToken)
    {
        if (await dbContext.Users.AnyAsync(cancellationToken))
        {
            return;
        }

        var adminRole = await dbContext.Roles.SingleAsync(x => x.Name == AppRoles.Admin, cancellationToken);
        var user = new UserEntity
        {
            Id = Guid.NewGuid(),
            UserName = adminOptions.Value.UserName,
            IsEnabled = true
        };
        user.PasswordHash = new PasswordHasher<UserEntity>().HashPassword(user, adminOptions.Value.Password);
        user.UserRoles.Add(new UserRoleEntity
        {
            UserId = user.Id,
            RoleId = adminRole.Id,
            User = user,
            Role = adminRole
        });

        dbContext.Users.Add(user);
        await dbContext.SaveChangesAsync(cancellationToken);
        logger.LogInformation("Bootstrapped admin user '{UserName}'.", user.UserName);
    }

    private async Task SeedViewerClientAsync(ILogger logger, CancellationToken cancellationToken)
    {
        if (await dbContext.ApiClients.AnyAsync(cancellationToken))
        {
            return;
        }

        var now = DateTimeOffset.UtcNow;
        dbContext.ApiClients.Add(new ApiClientEntity
        {
            Id = Guid.NewGuid(),
            Name = viewerClientOptions.Value.Name,
            ApiKeyHash = SecretHasher.Hash(viewerClientOptions.Value.ApiKey),
            IsEnabled = true,
            CreatedUtc = now,
            UpdatedUtc = now
        });
        await dbContext.SaveChangesAsync(cancellationToken);
        logger.LogInformation("Bootstrapped viewer API client '{ClientName}'.", viewerClientOptions.Value.Name);
    }
}
