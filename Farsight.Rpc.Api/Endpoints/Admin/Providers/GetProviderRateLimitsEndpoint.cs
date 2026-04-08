using Farsight.Rpc.Api.Models;
using Farsight.Rpc.Api.Persistence;
using Farsight.Rpc.Api.Services;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;

namespace Farsight.Rpc.Api.Endpoints.Admin.Providers;

public sealed class GetProviderRateLimitsEndpoint(RpcProvidersDbContext dbContext) : EndpointWithoutRequest<IReadOnlyList<ProviderRateLimitRow>>
{
    public override void Configure()
    {
        Get("/api/admin/providers");
        Policies(AuthorizationPolicies.ADMIN_ONLY);
    }

    public override async Task HandleAsync(CancellationToken ct)
        => await Send.OkAsync(await dbContext.Providers.AsNoTracking()
            .GroupJoin(
                dbContext.ProviderRateLimits.AsNoTracking(),
                provider => provider.Id,
                rateLimit => rateLimit.ProviderId,
                (provider, rateLimits) => new { provider, rateLimit = rateLimits.Select(x => (int?) x.RateLimit).FirstOrDefault() })
            .OrderBy(x => x.provider.Name)
            .Select(x => new ProviderRateLimitRow(x.provider.Id, x.provider.Name, x.rateLimit))
            .ToListAsync(ct), ct);
}
