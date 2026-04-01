using Farsight.RPC.Providers.Contracts;
using Farsight.RPC.Providers.Services;
using FastEndpoints;

namespace Farsight.RPC.Providers.Endpoints;

public sealed class GetTracingProvidersEndpoint(ProviderQueryService providerQueryService) : Endpoint<GetProvidersRequest, IReadOnlyList<TracingRpcEndpointDto>>
{
    public override void Configure()
    {
        Get("/api/providers/{Environment}/{Application}/{Chain}/tracing");
        Policies(AuthorizationPolicies.ViewerOnly);
    }

    public override async Task HandleAsync(GetProvidersRequest req, CancellationToken ct)
        => await Send.OkAsync(await providerQueryService.GetTracingAsync(req.Environment, req.Application, req.Chain, ct), ct);
}
