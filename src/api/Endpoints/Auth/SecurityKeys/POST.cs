using Farsight.Rpc.Api.Auth;
using Farsight.Rpc.Api.Persistence;
using Farsight.Rpc.Api.Persistence.Entities;
using FastEndpoints;
using Fido2NetLib;
using Fido2NetLib.Objects;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using System.Security.Claims;

namespace Farsight.Rpc.Api.Endpoints.Auth.SecurityKeys;

public sealed class POST(
    AppDbContext dbContext,
    SecurityKeyService securityKeyService,
    ILogger<POST> logger) : Endpoint<POST.Request, POST.Response>
{
    public sealed record Request(
        Guid ChallengeId,
        AuthenticatorAttestationRawResponse? Attestation
    );

    public new sealed record Response(
        Guid Id,
        string Name,
        DateTimeOffset CreatedAt
    );

    public override void Configure()
    {
        Post("/api/Auth/SecurityKeys");
        Roles(AuthRoles.ADMIN);
    }

    public override async Task HandleAsync(Request req, CancellationToken ct)
    {
        if(req.Attestation?.RawId is not { Length: > 0 }
            || req.Attestation.Response?.AttestationObject is not { Length: > 0 }
            || req.Attestation.Response.ClientDataJson is not { Length: > 0 })
        {
            ThrowError("The security key response is invalid.", StatusCodes.Status400BadRequest);
        }

        string username = User.FindFirstValue(ClaimTypes.Name)
            ?? throw new InvalidOperationException("The authenticated user has no username claim.");

        var now = DateTimeOffset.UtcNow;
        var challenge = await dbContext.SecurityKeyRegistrationChallenges
            .AsNoTracking()
            .SingleOrDefaultAsync(candidate => candidate.Id == req.ChallengeId
                && candidate.Username == username
                && candidate.ExpiresAt > now,
                ct
            );

        if(challenge is null)
        {
            ThrowError("The security key challenge is invalid or expired.", StatusCodes.Status400BadRequest);
        }

        int consumed = await dbContext.SecurityKeyChallenges
            .Where(candidate => candidate.Id == challenge.Id)
            .ExecuteDeleteAsync(ct);

        if(consumed != 1)
        {
            ThrowError("The security key challenge has already been used.", StatusCodes.Status400BadRequest);
        }

        RegisteredPublicKeyCredential credential;
        try
        {
            credential = await securityKeyService.VerifyRegistrationAsync(
                req.Attestation,
                challenge.Options,
                async (parameters, cancellationToken) => !await dbContext.UserSecurityKeys
                    .AnyAsync(key => key.CredentialId == parameters.CredentialId, cancellationToken),
                ct
            );
        }
        catch(Fido2VerificationException ex)
        {
            logger.LogWarning(ex,
                "Security key registration verification failed for user {Username} and challenge {ChallengeId}",
                username,
                req.ChallengeId);
            ThrowError("The security key response is invalid.", StatusCodes.Status400BadRequest);
            return;
        }
        catch(ArgumentException ex)
        {
            logger.LogWarning(ex,
                "Security key registration response was invalid for user {Username} and challenge {ChallengeId}",
                username,
                req.ChallengeId);
            ThrowError("The security key response is invalid.", StatusCodes.Status400BadRequest);
            return;
        }

        var securityKey = new UserSecurityKey
        {
            Id = Guid.NewGuid(),
            Username = username,
            Name = challenge.KeyName,
            CredentialId = credential.Id,
            PublicKey = credential.PublicKey,
            UserHandle = credential.User.Id,
            SignatureCounter = credential.SignCount,
            AaGuid = credential.AaGuid,
            CreatedAt = now,
        };
        dbContext.UserSecurityKeys.Add(securityKey);

        try
        {
            await dbContext.SaveChangesAsync(ct);
        }
        catch(DbUpdateException ex) when(ex.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation })
        {
            ThrowError("This security key is already registered.", StatusCodes.Status409Conflict);
        }

        await Send.OkAsync(new Response(securityKey.Id, securityKey.Name, securityKey.CreatedAt), ct);
    }
}
