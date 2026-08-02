using Farsight.Rpc.Api.Auth;
using Farsight.Rpc.Api.Persistence;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;

namespace Farsight.Rpc.Api.Endpoints.Applications.ApiKeys.Key;

public sealed class GET(AppDbContext dbContext) : Endpoint<GET.Request, GET.Response>
{
    public sealed record Request(
        [property: RouteParam] Guid ApplicationId,
        [property: RouteParam] Guid ApiKeyId
    );

    public new sealed record Response(
        string Key
    );

    public override void Configure()
    {
        Get("/api/Applications/{ApplicationId}/ApiKeys/{ApiKeyId}/Key");
        Roles(AuthRoles.ADMIN);
    }

    public override async Task HandleAsync(Request req, CancellationToken ct)
    {
        var apiKey = await dbContext.ConsumerApiKeys
            .AsNoTracking()
            .Where(apiKey => apiKey.ApplicationId == req.ApplicationId && apiKey.Id == req.ApiKeyId)
            .Select(apiKey => new Response(apiKey.Key))
            .SingleOrDefaultAsync(ct);

        if(apiKey is null)
        {
            ThrowError("API key not found.", StatusCodes.Status404NotFound);
        }

        await Send.OkAsync(apiKey, ct);
    }
}
