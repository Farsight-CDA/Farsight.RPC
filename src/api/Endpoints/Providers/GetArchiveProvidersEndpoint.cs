using Farsight.Rpc.Api.Auth;
using Farsight.Rpc.Types;
using Farsight.Rpc.Api.Persistence;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;

namespace Farsight.Rpc.Api.Endpoints.Providers;

public sealed class GetArchiveProvidersEndpoint(RpcProvidersDbContext dbContext) : Endpoint<GetProvidersRequest, IReadOnlyList<ArchiveRpcEndpointDto>>
{
    public override void Configure()
    {
        Get("/api/providers/{Chain}/archive");
        Policies(AuthorizationPolicies.VIEWER_ONLY);
    }

    public override async Task HandleAsync(GetProvidersRequest req, CancellationToken ct)
    {
        string normalizedChain = req.Chain.Trim().ToLowerInvariant();
        var providers = await dbContext.ArchiveEndpoints.AsNoTracking()
            .Where(x => x.Environment == ApiClientClaimTypes.GetRequiredEnvironment(User) && x.ApplicationId == ApiClientClaimTypes.GetRequiredApplicationId(User) && x.Chain.Name == normalizedChain)
            .OrderByDescending(x => x.UpdatedUtc)
            .Select(x => new ArchiveRpcEndpointDto(x.Id, x.Environment, x.Application.Name, x.Chain.Name, x.Provider.Name, x.Address, x.IndexerStepSize, x.DexIndexStepSize, x.IndexBlockOffset, x.UpdatedUtc))
            .ToListAsync(ct);

        await Send.OkAsync(providers, ct);
    }
}
