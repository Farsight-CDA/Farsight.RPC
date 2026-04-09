using Farsight.Rpc.Api.Auth;
using Farsight.Rpc.Api.Persistence;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;

namespace Farsight.Rpc.Api.Endpoints.Applications;

public sealed class GET(AppDbContext dbContext) : EndpointWithoutRequest<GET.ApplicationSummary[]>
{
    public sealed record ApplicationSummary(Guid Id, string Name, int ApiKeyCount, int RpcCount);

    public override void Configure()
    {
        Get("/api/applications");
        Roles(AuthRoles.ADMIN);
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var applications = await dbContext.ConsumerApplications
            .Select(a => new ApplicationSummary(
                a.Id,
                a.Name,
                a.ApiKeys!.Count,
                a.Rpcs!.Count
            ))
            .ToArrayAsync(ct);

        await Send.OkAsync(applications, ct);
    }
}
