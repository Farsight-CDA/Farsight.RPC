using Farsight.Common;
using Farsight.RPC.Providers.Configuration;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace Farsight.RPC.Providers.Services;

public partial class AdminAuthenticationService : Singleton
{
    [Inject] private readonly AdminLoginConfiguration _adminLoginOptions;

    public async Task<bool> SignInAsync(HttpContext httpContext, string userName, string password, CancellationToken cancellationToken)
    {
        if(!IsValidUserName(userName) || !IsValidPassword(password))
        {
            return false;
        }

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, AppRoles.ADMIN),
            new(ClaimTypes.Name, _adminLoginOptions.User),
            new(ClaimTypes.Role, AppRoles.ADMIN)
        };

        var principal = new ClaimsPrincipal(new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme));
        await httpContext.SignInAsync(CookieAuthenticationDefaults.AuthenticationScheme, principal);
        return true;
    }

    private bool IsValidPassword(string password)
    {
        byte[] providedPassword = Encoding.UTF8.GetBytes(password);
        byte[] configuredPassword = Encoding.UTF8.GetBytes(_adminLoginOptions.Password);
        return providedPassword.Length == configuredPassword.Length
            && CryptographicOperations.FixedTimeEquals(providedPassword, configuredPassword);
    }

    private bool IsValidUserName(string userName)
        => String.Equals(userName, _adminLoginOptions.User, StringComparison.Ordinal);
}
