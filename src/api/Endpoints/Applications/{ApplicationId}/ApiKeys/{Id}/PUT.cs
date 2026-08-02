using Farsight.Rpc.Api.Auth;
using Farsight.Rpc.Api.Common.Extensions;
using Farsight.Rpc.Api.Persistence;
using FastEndpoints;
using FluentValidation;
using Microsoft.EntityFrameworkCore;

namespace Farsight.Rpc.Api.Endpoints.Applications.ApiKeys;

public sealed class PUT(AppDbContext dbContext) : Endpoint<PUT.Request>
{
    public sealed record Request(
        [property: RouteParam] Guid ApplicationId,
        [property: RouteParam] Guid ApiKeyId,
        string Name
    );

    public sealed class Validator : Validator<Request>
    {
        public Validator()
        {
            RuleFor(x => x.Name).ApplyNameValidation();
        }
    }

    public override void Configure()
    {
        Put("/api/Applications/{ApplicationId}/ApiKeys/{ApiKeyId}");
        Roles(AuthRoles.ADMIN);
    }

    public override async Task HandleAsync(Request req, CancellationToken ct)
    {
        var apiKey = await dbContext.ConsumerApiKeys
            .SingleOrDefaultAsync(apiKey => apiKey.ApplicationId == req.ApplicationId && apiKey.Id == req.ApiKeyId, ct);

        if(apiKey is null)
        {
            ThrowError("API key not found.", 404);
        }

        apiKey.Name = req.Name;
        await dbContext.SaveChangesAsync(ct);
        await Send.NoContentAsync(ct);
    }
}
