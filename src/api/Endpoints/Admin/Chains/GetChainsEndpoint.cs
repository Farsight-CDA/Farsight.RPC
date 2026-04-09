using Farsight.Rpc.Api.Services;
using FastEndpoints;

namespace Farsight.Rpc.Api.Endpoints.Admin.Chains;

public sealed class GetChainsEndpoint : EndpointWithoutRequest<ReadOnlyMemory<string>>
{
    private readonly ChainService _chainService;

    public GetChainsEndpoint(ChainService chainService)
    {
        _chainService = chainService;
    }

    public override void Configure()
    {
        Get("/api/admin/chains");
        Policies(AuthorizationPolicies.ADMIN_ONLY);
    }

    public override async Task HandleAsync(CancellationToken ct)
        => await Send.OkAsync(_chainService.GetAllChainNames(), ct);
}
