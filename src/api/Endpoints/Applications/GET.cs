using Farsight.Rpc.Api.Auth;
using Farsight.Rpc.Api.Persistence;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;

namespace Farsight.Rpc.Api.Endpoints.Applications;

public sealed class GET(AppDbContext dbContext) : EndpointWithoutRequest<GET.ApplicationSummary[]>
{
    public sealed record ApplicationSummary(Guid Id, string Name, int TracingCount, int RealtimeCount, int ArchiveCount);

    public override void Configure()
    {
        Get("/api/applications");
        Policies(AuthPolicies.ADMIN_ONLY);
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var applications = await dbContext.ConsumerApplications
            .Select(a => new ApplicationSummary(
                a.Id,
                a.Name,
                a.TracingRpcs!.Count,
                a.RealtimeRpcs!.Count,
                a.ArchiveRpcs!.Count
            ))
            .ToArrayAsync(ct);

        await Send.OkAsync(applications, ct);
    }
}
