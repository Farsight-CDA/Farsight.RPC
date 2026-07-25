using Farsight.Rpc.Api.Auth;
using Farsight.Rpc.Api.Configuration;
using Farsight.Rpc.Api.Persistence;
using Farsight.Rpc.Api.Persistence.Entities;
using FastEndpoints;
using Fido2NetLib;
using Fido2NetLib.Objects;
using Microsoft.EntityFrameworkCore;

namespace Farsight.Rpc.Api.Endpoints.Auth.Login.SecurityKey;

public sealed class POST(
    AdminLoginConfiguration adminLoginConfiguration,
    AppDbContext dbContext,
    SecurityKeyService securityKeyService,
    AuthenticationTokenService tokenService,
    ILogger<POST> logger) : Endpoint<POST.Request, POST.Response>
{
    public sealed record Request(
        Guid ChallengeId,
        AuthenticatorAssertionRawResponse? Assertion
    );

    public new sealed record Response(
        string Token,
        string Username,
        DateTimeOffset ExpiresUtc
    );

    public override void Configure()
    {
        Post("/api/Auth/Login/SecurityKey");
        AllowAnonymous();
    }

    public override async Task HandleAsync(Request req, CancellationToken ct)
    {
        if(req.Assertion?.RawId is not { Length: > 0 }
            || req.Assertion.Response?.AuthenticatorData is not { Length: > 0 }
            || req.Assertion.Response.ClientDataJson is not { Length: > 0 }
            || req.Assertion.Response.Signature is not { Length: > 0 })
        {
            await Send.UnauthorizedAsync(ct);
            return;
        }

        var now = DateTimeOffset.UtcNow;
        var challenge = await dbContext.SecurityKeyLoginChallenges
            .AsNoTracking()
            .SingleOrDefaultAsync(candidate => candidate.Id == req.ChallengeId
                && candidate.ExpiresAt > now,
                ct
            );

        if(challenge is null || !adminLoginConfiguration.Users.Any(user => user.Username == challenge.Username))
        {
            await Send.UnauthorizedAsync(ct);
            return;
        }

        int consumed = await dbContext.SecurityKeyChallenges
            .Where(candidate => candidate.Id == challenge.Id)
            .ExecuteDeleteAsync(ct);

        if(consumed != 1)
        {
            await Send.UnauthorizedAsync(ct);
            return;
        }

        var userKeys = await dbContext.UserSecurityKeys
            .Where(key => key.Username == challenge.Username)
            .ToArrayAsync(ct);

        var securityKey = userKeys.SingleOrDefault(key =>
            key.CredentialId.AsSpan().SequenceEqual(req.Assertion.RawId));

        if(securityKey is null)
        {
            await Send.UnauthorizedAsync(ct);
            return;
        }

        VerifyAssertionResult assertion;
        try
        {
            assertion = await securityKeyService.VerifyAssertionAsync(req.Assertion, challenge.Options, securityKey, ct);
        }
        catch(Fido2VerificationException ex)
        {
            logger.LogWarning(ex,
                "Security key login verification failed for user {Username} and challenge {ChallengeId}",
                challenge.Username,
                req.ChallengeId);
            await Send.UnauthorizedAsync(ct);
            return;
        }
        catch(ArgumentException ex)
        {
            logger.LogWarning(ex,
                "Security key login response was invalid for user {Username} and challenge {ChallengeId}",
                challenge.Username,
                req.ChallengeId);
            await Send.UnauthorizedAsync(ct);
            return;
        }

        long previousCounter = securityKey.SignatureCounter;
        int updated = await dbContext.UserSecurityKeys
            .Where(key => key.Id == securityKey.Id && key.SignatureCounter == previousCounter)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(key => key.SignatureCounter, assertion.SignCount)
                .SetProperty(key => key.LastUsedAt, now), ct);

        if(updated != 1)
        {
            await Send.UnauthorizedAsync(ct);
            return;
        }

        var accessToken = tokenService.CreateAccessToken(challenge.Username, securityKeyVerified: true);
        await Send.OkAsync(new Response(accessToken.Token, challenge.Username, accessToken.ExpiresUtc), ct);
    }
}
