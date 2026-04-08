using Farsight.RPC.Providers.Auth;
using Farsight.RPC.Providers.Contracts;
using Farsight.RPC.Providers.Services;
using FastEndpoints;

namespace Farsight.RPC.Providers.Endpoints;

public sealed class GetTracingProvidersEndpoint(ProviderQueryService providerQueryService) : Endpoint<GetProvidersRequest, IReadOnlyList<TracingRpcEndpointDto>>
{
    public override void Configure()
    {
        Get("/api/providers/{Chain}/tracing");
        Policies(AuthorizationPolicies.VIEWER_ONLY);
    }

    public override async Task HandleAsync(GetProvidersRequest req, CancellationToken ct)
        => await Send.OkAsync(await providerQueryService.GetTracingAsync(ApiClientClaimTypes.GetRequiredEnvironment(User), ApiClientClaimTypes.GetRequiredApplicationId(User), req.Chain, ct), ct);
}
