using Farsight.Rpc.Api.Auth;
using Farsight.Rpc.Api.Configuration;
using Farsight.Rpc.Api.Persistence;
using Farsight.Rpc.Api.Persistence.Entities;
using FastEndpoints;
using Fido2NetLib;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Farsight.Rpc.Api.Endpoints.Auth.SecurityKeys.Options;

public sealed class POST(
    AppDbContext dbContext,
    SecurityKeyConfiguration securityKeyConfiguration,
    SecurityKeyService securityKeyService) : Endpoint<POST.Request, POST.Response>
{
    public sealed record Request(string Name);

    public new sealed record Response(
        Guid ChallengeId,
        CredentialCreateOptions Options
    );

    public sealed class Validator : Validator<Request>
    {
        public Validator()
        {
            RuleFor(x => x.Name).NotEmpty().MaximumLength(100);
        }
    }

    public override void Configure()
    {
        Post("/api/Auth/SecurityKeys/Options");
        Roles(AuthRoles.ADMIN);
    }

    public override async Task HandleAsync(Request req, CancellationToken ct)
    {
        string username = User.FindFirstValue(ClaimTypes.Name)
            ?? throw new InvalidOperationException("The authenticated user has no username claim.");
        var existingKeys = await dbContext.UserSecurityKeys
            .Where(key => key.Username == username)
            .ToArrayAsync(ct);

        var options = securityKeyService.CreateRegistrationOptions(username, existingKeys);
        var now = DateTimeOffset.UtcNow;
        await dbContext.SecurityKeyChallenges
            .Where(challenge => challenge.ExpiresAt <= now)
            .ExecuteDeleteAsync(ct);

        var challenge = new SecurityKeyChallenge.Registration
        {
            Id = Guid.NewGuid(),
            Username = username,
            KeyName = req.Name,
            Options = options,
            ExpiresAt = now.AddMinutes(securityKeyConfiguration.ChallengeExpiryMinutes),
        };
        dbContext.SecurityKeyRegistrationChallenges.Add(challenge);
        await dbContext.SaveChangesAsync(ct);

        await Send.OkAsync(new Response(challenge.Id, options), ct);
    }
}
