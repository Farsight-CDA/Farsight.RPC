using Farsight.RPC.Providers.Contracts;
using Farsight.RPC.Providers.Services;
using FastEndpoints;

namespace Farsight.RPC.Providers.Endpoints;

public sealed class GetArchiveProvidersEndpoint(ProviderQueryService providerQueryService) : Endpoint<GetProvidersRequest, IReadOnlyList<ArchiveRpcEndpointDto>>
{
    public override void Configure()
    {
        Get("/api/providers/{Environment}/{Application}/{Chain}/archive");
        Policies(AuthorizationPolicies.ViewerOnly);
    }

    public override async Task HandleAsync(GetProvidersRequest req, CancellationToken ct)
        => await Send.OkAsync(await providerQueryService.GetArchiveAsync(req.Environment, req.Application, req.Chain, ct), ct);
}
