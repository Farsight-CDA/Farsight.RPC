using Farsight.Rpc.Api.Auth;
using Farsight.Rpc.Api.Persistence;
using Farsight.Rpc.Types;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;

namespace Farsight.Rpc.Api.Endpoints.Applications;

public sealed class GETById(AppDbContext dbContext) : Endpoint<GETById.Request, GETById.Response>
{
    public sealed record ApiKeySummary(
        Guid Id,
        HostEnvironment Environment,
        string Key,
        DateTimeOffset? LastUsedAt
    );

    public sealed record Request(
        [property: RouteParam] Guid Id
    );

    public new sealed record Response(
        Guid Id,
        string Name,
        ApiKeySummary[] ApiKeys,
        RpcStructureType[] Structures
    );

    public override void Configure()
    {
        Get("/api/Applications/{Id}");
        Roles(AuthRoles.ADMIN);
    }

    public override async Task HandleAsync(Request req, CancellationToken ct)
    {
        var application = await dbContext.ConsumerApplications
            .AsNoTracking()
            .Where(a => a.Id == req.Id)
            .Select(a => new { a.Id, a.Name, a.Structures })
            .SingleOrDefaultAsync(ct);

        if(application is null)
        {
            ThrowError("Application not found.", 404);
        }

        var apiKeys = await dbContext.ConsumerApiKeys
            .Where(k => k.ApplicationId == req.Id)
            .OrderBy(k => k.Id)
            .Select(k => new ApiKeySummary(k.Id, k.Environment, k.Key, k.LastUsedAt))
            .ToArrayAsync(ct);

        await Send.OkAsync(new Response(
            application.Id,
            application.Name,
            apiKeys,
            application.Structures
        ), ct);
    }
}
