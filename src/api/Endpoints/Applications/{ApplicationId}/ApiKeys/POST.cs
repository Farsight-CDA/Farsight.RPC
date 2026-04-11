using Farsight.Rpc.Api.Auth;
using Farsight.Rpc.Api.Persistence;
using Farsight.Rpc.Api.Persistence.Entities;
using FastEndpoints;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;

namespace Farsight.Rpc.Api.Endpoints.Applications.ApiKeys;

public sealed class POST(AppDbContext dbContext) : Endpoint<POST.Request>
{
    public sealed record Request(
        [property: RouteParam] Guid ApplicationId,
        Guid EnvironmentId
    );

    public sealed class Validator : Validator<Request>
    {
        public Validator()
        {
            RuleFor(x => x.EnvironmentId)
                .Must(static environmentId => environmentId != Guid.Empty)
                .WithMessage("Environment is required.");
        }
    }

    public override void Configure()
    {
        Post("/api/Applications/{ApplicationId}/ApiKeys");
        Roles(AuthRoles.ADMIN);
    }

    public override async Task HandleAsync(Request req, CancellationToken ct)
    {
        if(!await dbContext.ConsumerApplications.AnyAsync(a => a.Id == req.ApplicationId, ct))
        {
            ThrowError("Application not found.", 404);
        }

        if(!await dbContext.ApplicationEnvironments.AnyAsync(environment => environment.ApplicationId == req.ApplicationId && environment.Id == req.EnvironmentId, ct))
        {
            ThrowError("Environment not found.", 404);
        }

        var apiKey = new ConsumerApiKey
        {
            Id = Guid.NewGuid(),
            ApplicationId = req.ApplicationId,
            EnvironmentId = req.EnvironmentId,
            Key = Convert.ToHexString(RandomNumberGenerator.GetBytes(32)).ToLowerInvariant(),
        };

        dbContext.ConsumerApiKeys.Add(apiKey);
        await dbContext.SaveChangesAsync(ct);
        await Send.NoContentAsync(ct);
    }
}
