using Farsight.Rpc.Api.Auth;
using Farsight.Rpc.Api.Configuration;
using Farsight.Rpc.Api.Persistence;
using Farsight.Rpc.Api.Persistence.Entities;
using FastEndpoints;
using Fido2NetLib;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using System.Text;

namespace Farsight.Rpc.Api.Endpoints.Auth.Login;

public sealed class POST(
    AdminLoginConfiguration adminLoginConfiguration,
    AppDbContext dbContext,
    SecurityKeyConfiguration securityKeyConfiguration,
    SecurityKeyService securityKeyService,
    AuthenticationTokenService tokenService) : Endpoint<POST.Request, POST.Response>
{
    public sealed record Request(
        string Username,
        string Password
    );

    public new sealed record Response(
        string? Token,
        string Username,
        DateTimeOffset? ExpiresUtc,
        bool RequiresTwoFactor,
        Guid? TwoFactorChallengeId,
        AssertionOptions? SecurityKeyOptions
    );

    public override void Configure()
    {
        Post("/api/Auth/Login");
        AllowAnonymous();
    }

    public override async Task HandleAsync(Request req, CancellationToken ct)
    {
        var user = adminLoginConfiguration.Users
            .SingleOrDefault(x => x.Username == req.Username);

        if(user is null || !IsValidPassword(req.Password, user.PasswordHash))
        {
            await Send.UnauthorizedAsync(ct);
            return;
        }

        var securityKeys = await dbContext.UserSecurityKeys
            .Where(key => key.Username == req.Username)
            .ToArrayAsync(ct);

        if(securityKeys.Length > 0)
        {
            var options = securityKeyService.CreateAssertionOptions(securityKeys);
            var now = DateTimeOffset.UtcNow;
            await dbContext.SecurityKeyChallenges
                .Where(challenge => challenge.ExpiresAt <= now)
                .ExecuteDeleteAsync(ct);

            var challenge = new SecurityKeyChallenge.Login
            {
                Id = Guid.NewGuid(),
                Username = req.Username,
                Options = options,
                ExpiresAt = now.AddMinutes(securityKeyConfiguration.ChallengeExpiryMinutes),
            };

            dbContext.SecurityKeyLoginChallenges.Add(challenge);
            await dbContext.SaveChangesAsync(ct);
            await Send.OkAsync(new Response(null, req.Username, null, true, challenge.Id, options), ct);
            return;
        }

        var accessToken = tokenService.CreateAccessToken(req.Username);
        await Send.OkAsync(new Response(accessToken.Token, req.Username, accessToken.ExpiresUtc, false, null, null), ct);
    }

    private static bool IsValidPassword(string password, string passwordHash)
    {
        byte[] providedHash = SHA256.HashData(Encoding.UTF8.GetBytes(password));
        byte[] configuredHash = Convert.FromHexString(passwordHash);
        return CryptographicOperations.FixedTimeEquals(providedHash, configuredHash);
    }
}
