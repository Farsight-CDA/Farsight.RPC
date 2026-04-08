using Farsight.RPC.Providers.Auth;
using Farsight.RPC.Providers.Contracts;
using Farsight.RPC.Providers.Services;
using FastEndpoints;

namespace Farsight.RPC.Providers.Endpoints;

public sealed class GetArchiveProvidersEndpoint(ProviderQueryService providerQueryService) : Endpoint<GetProvidersRequest, IReadOnlyList<ArchiveRpcEndpointDto>>
{
    public override void Configure()
    {
        Get("/api/providers/{Chain}/archive");
        Policies(AuthorizationPolicies.VIEWER_ONLY);
    }

    public override async Task HandleAsync(GetProvidersRequest req, CancellationToken ct)
        => await Send.OkAsync(await providerQueryService.GetArchiveAsync(ApiClientClaimTypes.GetRequiredEnvironment(User), ApiClientClaimTypes.GetRequiredApplicationId(User), req.Chain, ct), ct);
}
