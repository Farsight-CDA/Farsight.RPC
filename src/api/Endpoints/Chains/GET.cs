using Farsight.Common.Extensions;
using Farsight.Rpc.Api.Auth;
using Farsight.Rpc.Api.Services;
using FastEndpoints;

namespace Farsight.Rpc.Api.Endpoints.Chains;

public sealed class GET(ChainService chainService) : EndpointWithoutRequest<ReadOnlyMemory<string>>
{
    private readonly ChainService _chainService = chainService;

    public override void Configure()
    {
        Get("/api/Chains");
        Roles(AuthRoles.ADMIN);
    }

    public override async Task HandleAsync(CancellationToken ct)
        => await Send.OkAsync(_chainService.Chains.Select(x => x.Name).ToArray(), ct);
}
