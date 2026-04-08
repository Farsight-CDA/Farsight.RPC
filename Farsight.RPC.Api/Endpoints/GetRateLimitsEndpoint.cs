using Farsight.Rpc.Types;
using Farsight.Rpc.Api.Persistence;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;

namespace Farsight.Rpc.Api.Endpoints;

public sealed class GetRateLimitsEndpoint(RpcProvidersDbContext dbContext) : EndpointWithoutRequest<IReadOnlyList<ProviderRateLimitDto>>
{
    public override void Configure()
    {
        Get("/api/rate-limits");
        Policies(AuthorizationPolicies.VIEWER_ONLY);
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var rateLimits = await dbContext.Providers.AsNoTracking()
            .OrderBy(x => x.Name)
            .Select(x => new ProviderRateLimitDto(x.Name, x.RateLimit))
            .ToListAsync(ct);

        await Send.OkAsync(rateLimits, ct);
    }
}
