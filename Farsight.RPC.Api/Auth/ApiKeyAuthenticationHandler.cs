using Farsight.Rpc.Types;
using Farsight.Rpc.Api.Persistence;
using Microsoft.AspNetCore.Authentication;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using System.Security.Claims;
using System.Text.Encodings.Web;

namespace Farsight.Rpc.Api.Auth;

public sealed class ApiKeyAuthenticationHandler(
    IOptionsMonitor<ApiKeyAuthenticationOptions> options,
    ILoggerFactory logger,
    UrlEncoder encoder,
    IDbContextFactory<RpcProvidersDbContext> dbContextFactory) : AuthenticationHandler<ApiKeyAuthenticationOptions>(options, logger, encoder)
{
    protected override async Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        if(!Request.Headers.TryGetValue(ApiKeyHeaders.API_KEY, out var values) || String.IsNullOrWhiteSpace(values.FirstOrDefault()))
        {
            return AuthenticateResult.NoResult();
        }

        string providedKey = values.First()!;
        await using var dbContext = await dbContextFactory.CreateDbContextAsync(Context.RequestAborted);
        var client = await dbContext.ApiClients
            .AsNoTracking()
            .SingleOrDefaultAsync(x => x.ApiKey == providedKey && x.IsEnabled, Context.RequestAborted);

        if(client is null)
        {
            return AuthenticateResult.Fail("Invalid API key.");
        }

        if(!client.ApplicationId.HasValue || !client.Environment.HasValue)
        {
            return AuthenticateResult.Fail("API key is not scoped to an application and environment.");
        }

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, client.Id.ToString()),
            new Claim(ClaimTypes.Name, client.ApiKey),
            new Claim(ClaimTypes.Role, AppRoles.VIEWER),
            new Claim(ApiClientClaimTypes.APPLICATION_ID, client.ApplicationId.Value.ToString()),
            new Claim(ApiClientClaimTypes.ENVIRONMENT, client.Environment.Value.ToString())
        };

        var identity = new ClaimsIdentity(claims, ApiKeyAuthenticationDefaults.SCHEME);
        var principal = new ClaimsPrincipal(identity);
        var ticket = new AuthenticationTicket(principal, ApiKeyAuthenticationDefaults.SCHEME);
        return AuthenticateResult.Success(ticket);
    }
}
