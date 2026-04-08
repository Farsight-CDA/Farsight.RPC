using Farsight.RPC.Providers.Contracts;
using Farsight.RPC.Providers.Services;
using FastEndpoints;

namespace Farsight.RPC.Providers.Endpoints;

public sealed class GetRateLimitsEndpoint(ProviderQueryService providerQueryService) : EndpointWithoutRequest<IReadOnlyList<ProviderRateLimitDto>>
{
    public override void Configure()
    {
        Get("/api/rate-limits");
        Policies(AuthorizationPolicies.VIEWER_ONLY);
    }

    public override async Task HandleAsync(CancellationToken ct)
        => await Send.OkAsync(await providerQueryService.GetRateLimitsAsync(ct), ct);
}
