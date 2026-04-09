using Farsight.Rpc.Api.Auth;
using Farsight.Rpc.Api.Configuration;
using FastEndpoints;
using FastEndpoints.Security;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace Farsight.Rpc.Api.Endpoints.Auth.Login;

public sealed class POST(AdminLoginConfiguration adminLoginConfiguration, JwtConfiguration jwtConfiguration) : Endpoint<POST.Request, POST.Response>
{
    public sealed record Request(
        string Username,
        string Password
    );
    public new sealed record Response(
        string Token,
        string Username,
        DateTimeOffset ExpiresUtc
    );

    public override void Configure()
    {
        Post("/api/auth/login");
        AllowAnonymous();
    }

    public override async Task HandleAsync(Request req, CancellationToken ct)
    {
        if(req.Username != adminLoginConfiguration.User || !IsValidPassword(req.Password))
        {
            await Send.UnauthorizedAsync(ct);
            return;
        }

        var expiresUtc = DateTimeOffset.UtcNow.AddMinutes(jwtConfiguration.ExpiryMinutes);
        string token = JwtBearer.CreateToken(options =>
        {
            options.ExpireAt = expiresUtc.UtcDateTime;
            options.User.Roles.Add(AuthRoles.ADMIN);
            options.User.Claims.Add(new Claim(JwtRegisteredClaimNames.Sub, req.Username));
            options.User.Claims.Add(new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()));
            options.User.Claims.Add(new Claim(ClaimTypes.NameIdentifier, AuthRoles.ADMIN));
            options.User.Claims.Add(new Claim(ClaimTypes.Name, req.Username));
        });

        await Send.OkAsync(new Response(token, req.Username, expiresUtc), ct);
    }

    private bool IsValidPassword(string password)
    {
        byte[] providedPassword = Encoding.UTF8.GetBytes(password);
        byte[] configuredPassword = Encoding.UTF8.GetBytes(adminLoginConfiguration.Password);
        return providedPassword.Length == configuredPassword.Length
            && CryptographicOperations.FixedTimeEquals(providedPassword, configuredPassword);
    }
}
