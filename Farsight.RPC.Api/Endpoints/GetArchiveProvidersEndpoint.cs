using Farsight.RPC.Api.Auth;
using Farsight.RPC.Types;
using Farsight.RPC.Api.Persistence;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;

namespace Farsight.RPC.Api.Endpoints;

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
            .OrderByDescending(x => x.ProbedUtc)
            .ThenByDescending(x => x.UpdatedUtc)
            .Select(x => new ArchiveRpcEndpointDto(x.Id, x.Environment, x.Application.Name, x.Chain.Name, x.Provider.Name, x.Address, x.IndexerStepSize, x.DexIndexStepSize, x.IndexBlockOffset, x.UpdatedUtc, x.ProbedUtc))
            .ToListAsync(ct);

        await Send.OkAsync(providers, ct);
    }
}
