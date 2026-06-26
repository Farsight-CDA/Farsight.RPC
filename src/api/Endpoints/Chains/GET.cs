using Farsight.Common.Extensions;
using Farsight.Chains;
using Farsight.Rpc.Api.Auth;
using FastEndpoints;

namespace Farsight.Rpc.Api.Endpoints.Chains;

public sealed class GET : EndpointWithoutRequest<ReadOnlyMemory<string>>
{
    public override void Configure()
    {
        Get("/api/Chains");
        Roles(AuthRoles.ADMIN);
    }

    public override async Task HandleAsync(CancellationToken ct)
        => await Send.OkAsync(ChainRegistry.GetAllChains().Select(x => x.Name).ToArray(), ct);
}
