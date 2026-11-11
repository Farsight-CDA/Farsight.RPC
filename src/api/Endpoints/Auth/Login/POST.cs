using Farsight.Rpc.Api.Auth;
using Farsight.Rpc.Api.Configuration;
using Farsight.Rpc.Api.Persistence;
using Farsight.Rpc.Api.Persistence.Entities;
using FastEndpoints;
using Fido2NetLib;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json.Serialization;

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

    [JsonUnion(TypeClassifier = typeof(JsonUnionTypeStructuralClassifier))]
    public new readonly union Response(Response.Authenticated, Response.SecurityKeyRequired)
    {
        public sealed record Authenticated(
            string Token,
            string Username,
            DateTimeOffset ExpiresUtc
        )
        {
            public bool RequiresTwoFactor => false;
        }

        public sealed record SecurityKeyRequired(
            string Username,
            Guid TwoFactorChallengeId,
            AssertionOptions SecurityKeyOptions
        )
        {
            public bool RequiresTwoFactor => true;
        }
    }

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
            await Send.OkAsync(new Response.SecurityKeyRequired(req.Username, challenge.Id, options), ct);
            return;
        }

        var accessToken = tokenService.CreateAccessToken(req.Username);
        await Send.OkAsync(new Response.Authenticated(accessToken.Token, req.Username, accessToken.ExpiresUtc), ct);
    }

    private static bool IsValidPassword(string password, string passwordHash)
    {
        byte[] providedHash = SHA256.HashData(Encoding.UTF8.GetBytes(password));
        byte[] configuredHash = Convert.FromHexString(passwordHash);
        return CryptographicOperations.FixedTimeEquals(providedHash, configuredHash);
    }
}
