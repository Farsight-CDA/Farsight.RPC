using Farsight.RPC.Providers.Contracts;
using Farsight.RPC.Providers.Services;
using FastEndpoints;

namespace Farsight.RPC.Providers.Endpoints;

public sealed class GetRealTimeProvidersEndpoint(ProviderQueryService providerQueryService) : Endpoint<GetProvidersRequest, IReadOnlyList<RealTimeRpcEndpointDto>>
{
    public override void Configure()
    {
        Get("/api/providers/{Environment}/{Application}/{Chain}/realtime");
        Policies(AuthorizationPolicies.ViewerOnly);
    }

    public override async Task HandleAsync(GetProvidersRequest req, CancellationToken ct)
        => await Send.OkAsync(await providerQueryService.GetRealTimeAsync(req.Environment, req.Application, req.Chain, ct), ct);
}
