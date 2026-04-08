using Farsight.RPC.Providers.Contracts;
using Farsight.RPC.Providers.Data;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;

namespace Farsight.RPC.Providers.Endpoints;

public sealed class GetRateLimitsEndpoint(RpcProvidersDbContext dbContext) : EndpointWithoutRequest<IReadOnlyList<ProviderRateLimitDto>>
{
    public override void Configure()
    {
        Get("/api/rate-limits");
        Policies(AuthorizationPolicies.VIEWER_ONLY);
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var rateLimits = await dbContext.ProviderRateLimits.AsNoTracking()
            .OrderBy(x => x.Provider.Name)
            .Select(x => new ProviderRateLimitDto(x.Provider.Name, x.RateLimit))
            .ToListAsync(ct);

        await Send.OkAsync(rateLimits, ct);
    }
}
