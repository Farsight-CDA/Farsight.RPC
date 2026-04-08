using Farsight.RPC.Providers.Auth;
using Farsight.RPC.Providers.Contracts;
using Farsight.RPC.Providers.Services;
using FastEndpoints;

namespace Farsight.RPC.Providers.Endpoints;

public sealed class GetRealTimeProvidersEndpoint(ProviderQueryService providerQueryService) : Endpoint<GetProvidersRequest, IReadOnlyList<RealTimeRpcEndpointDto>>
{
    public override void Configure()
    {
        Get("/api/providers/{Chain}/realtime");
        Policies(AuthorizationPolicies.VIEWER_ONLY);
    }

    public override async Task HandleAsync(GetProvidersRequest req, CancellationToken ct)
        => await Send.OkAsync(await providerQueryService.GetRealTimeAsync(ApiClientClaimTypes.GetRequiredEnvironment(User), ApiClientClaimTypes.GetRequiredApplicationId(User), req.Chain, ct), ct);
}
