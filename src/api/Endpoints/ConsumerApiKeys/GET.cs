using Farsight.Rpc.Api.Auth;
using Farsight.Rpc.Api.Persistence;
using Farsight.Rpc.Types;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;

namespace Farsight.Rpc.Api.Endpoints.ConsumerApiKeys;

public sealed class GET(AppDbContext dbContext) : Endpoint<GET.Request, GET.ApiKeySummary[]>
{
    public sealed record ApiKeySummary(
        Guid Id,
        HostEnvironment Environment,
        string Key
    );

    public sealed record Request(
        [property: RouteParam] Guid ApplicationId
    );

    public override void Configure()
    {
        Get("/api/applications/{applicationId}/api-keys");
        Roles(AuthRoles.ADMIN);
    }

    public override async Task HandleAsync(Request req, CancellationToken ct)
    {
        if(!await dbContext.ConsumerApplications.AnyAsync(a => a.Id == req.ApplicationId, ct))
        {
            ThrowError("Application not found.", 404);
        }

        var keys = await dbContext.ConsumerApiKeys
            .Where(k => k.ApplicationId == req.ApplicationId)
            .OrderBy(k => k.Environment)
            .ThenBy(k => k.Id)
            .Select(k => new ApiKeySummary(
                k.Id,
                k.Environment,
                k.Key))
            .ToArrayAsync(ct);

        await Send.OkAsync(keys, ct);
    }
}
