using System.Security.Claims;
using System.Text.Encodings.Web;
using Farsight.RPC.Providers.Data;
using Microsoft.AspNetCore.Authentication;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace Farsight.RPC.Providers.Auth;

public sealed class ApiKeyAuthenticationHandler(
    IOptionsMonitor<ApiKeyAuthenticationOptions> options,
    ILoggerFactory logger,
    UrlEncoder encoder,
    RpcProvidersDbContext dbContext) : AuthenticationHandler<ApiKeyAuthenticationOptions>(options, logger, encoder)
{
    protected override async Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        if (!Request.Headers.TryGetValue("X-Api-Key", out var values) || string.IsNullOrWhiteSpace(values.FirstOrDefault()))
        {
            return AuthenticateResult.NoResult();
        }

        var providedKey = values.First()!;
        var providedHash = SecretHasher.Hash(providedKey);
        var client = await dbContext.ApiClients
            .AsNoTracking()
            .SingleOrDefaultAsync(x => x.ApiKeyHash == providedHash && x.IsEnabled, Context.RequestAborted);

        if (client is null)
        {
            return AuthenticateResult.Fail("Invalid API key.");
        }

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, client.Id.ToString()),
            new Claim(ClaimTypes.Name, client.Name),
            new Claim(ClaimTypes.Role, AppRoles.Viewer)
        };

        var identity = new ClaimsIdentity(claims, ApiKeyAuthenticationDefaults.Scheme);
        var principal = new ClaimsPrincipal(identity);
        var ticket = new AuthenticationTicket(principal, ApiKeyAuthenticationDefaults.Scheme);
        return AuthenticateResult.Success(ticket);
    }
}
