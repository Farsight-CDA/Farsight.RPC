using Farsight.Common;
using Farsight.RPC.Providers.Persistence.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Farsight.RPC.Providers.Persistence;

public partial class DbInitializer : Singleton
{
    [Inject] private readonly IDbContextFactory<RpcProvidersDbContext> _dbContextFactory;
    [Inject] private readonly AdminLoginOptions _adminLoginOptions;

    protected override async Task InitializeAsync(CancellationToken cancellationToken)
    {
        await using var dbContext = await _dbContextFactory.CreateDbContextAsync(cancellationToken);
        await dbContext.Database.MigrateAsync(cancellationToken);
        await SeedRolesAsync(dbContext, cancellationToken);
        await SeedAdminAsync(dbContext, cancellationToken);
    }

    private static async Task SeedRolesAsync(RpcProvidersDbContext dbContext, CancellationToken cancellationToken)
    {
        if(!await dbContext.Roles.AnyAsync(cancellationToken))
        {
            dbContext.Roles.AddRange(
            new RoleEntity { Id = Guid.NewGuid(), Name = AppRoles.ADMIN },
                new RoleEntity { Id = Guid.NewGuid(), Name = AppRoles.VIEWER });
            await dbContext.SaveChangesAsync(cancellationToken);
        }
    }

    private async Task SeedAdminAsync(RpcProvidersDbContext dbContext, CancellationToken cancellationToken)
    {
        var adminRole = await dbContext.Roles.SingleAsync(x => x.Name == AppRoles.ADMIN, cancellationToken);
        var user = await dbContext.Users
            .Include(x => x.UserRoles)
            .SingleOrDefaultAsync(x => x.UserName == _adminLoginOptions.User, cancellationToken);

        bool isNewUser = user is null;
        user ??= new UserEntity
        {
            Id = Guid.NewGuid(),
            UserName = _adminLoginOptions.User,
            IsEnabled = true
        };

        user.UserName = _adminLoginOptions.User;
        user.IsEnabled = true;
        user.PasswordHash = new PasswordHasher<UserEntity>().HashPassword(user, _adminLoginOptions.Password);

        if(!user.UserRoles.Any(x => x.RoleId == adminRole.Id))
        {
            user.UserRoles.Add(new UserRoleEntity
            {
                UserId = user.Id,
                RoleId = adminRole.Id,
                User = user,
                Role = adminRole
            });
        }

        if(isNewUser)
        {
            dbContext.Users.Add(user);
        }

        await dbContext.SaveChangesAsync(cancellationToken);
        _logger.LogInformation(
            isNewUser
                ? "Created configured admin user '{UserName}'."
                : "Updated configured admin user '{UserName}'.",
            user.UserName);
    }
}
