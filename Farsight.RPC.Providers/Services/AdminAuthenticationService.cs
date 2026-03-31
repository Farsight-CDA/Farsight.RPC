using System.Security.Claims;
using Farsight.RPC.Providers.Data;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Farsight.RPC.Providers.Services;

public sealed class AdminAuthenticationService(RpcProvidersDbContext dbContext)
{
    public async Task<bool> SignInAsync(HttpContext httpContext, string userName, string password, CancellationToken cancellationToken)
    {
        var user = await dbContext.Users
            .AsNoTracking()
            .Include(x => x.UserRoles)
            .ThenInclude(x => x.Role)
            .SingleOrDefaultAsync(x => x.UserName == userName && x.IsEnabled, cancellationToken);

        if (user is null)
        {
            return false;
        }

        var result = new PasswordHasher<Data.Entities.UserEntity>().VerifyHashedPassword(user, user.PasswordHash, password);
        if (result == PasswordVerificationResult.Failed)
        {
            return false;
        }

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Name, user.UserName)
        };
        claims.AddRange(user.UserRoles.Select(x => new Claim(ClaimTypes.Role, x.Role.Name)));

        var principal = new ClaimsPrincipal(new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme));
        await httpContext.SignInAsync(CookieAuthenticationDefaults.AuthenticationScheme, principal);
        return true;
    }
}
