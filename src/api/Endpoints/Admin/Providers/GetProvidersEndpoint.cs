using Farsight.Rpc.Api.Models;
using Farsight.Rpc.Api.Persistence;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;

namespace Farsight.Rpc.Api.Endpoints.Admin.Providers;

public sealed class GetProvidersEndpoint(RpcProvidersDbContext dbContext) : EndpointWithoutRequest<IReadOnlyList<ProviderRateLimitRow>>
{
    public override void Configure()
    {
        Get("/api/admin/providers");
        Policies(AuthorizationPolicies.ADMIN_ONLY);
    }

    public override async Task HandleAsync(CancellationToken ct)
        => await Send.OkAsync(await dbContext.Providers.AsNoTracking()
            .OrderBy(x => x.Name)
            .Select(x => new ProviderRateLimitRow(x.Id, x.Name, x.RateLimit))
            .ToListAsync(ct), ct);
}
