using Farsight.RPC.Providers.Contracts;
using Farsight.RPC.Providers.Services;
using FastEndpoints;

namespace Farsight.RPC.Providers.Endpoints;

public sealed class GetProvidersEndpoint(ProviderQueryService providerQueryService) : Endpoint<GetProvidersRequest, RpcProviderSetDto>
{
    public override void Configure()
    {
        Get("/api/providers/{Environment}/{Application}/{Chain}");
        Policies(AuthorizationPolicies.ViewerOnly);
    }

    public override async Task HandleAsync(GetProvidersRequest req, CancellationToken ct)
        => await Send.OkAsync(await providerQueryService.GetProviderSetAsync(req.Environment, req.Application, req.Chain, ct), ct);
}

public sealed record GetProvidersRequest(HostEnvironment Environment, string Application, string Chain);
