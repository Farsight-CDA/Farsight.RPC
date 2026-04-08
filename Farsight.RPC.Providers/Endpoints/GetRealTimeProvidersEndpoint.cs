using Farsight.RPC.Providers.Auth;
using Farsight.RPC.Providers.Contracts;
using Farsight.RPC.Providers.Data;
using Farsight.RPC.Providers.Services;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;

namespace Farsight.RPC.Providers.Endpoints;

public sealed class GetRealTimeProvidersEndpoint(RpcProvidersDbContext dbContext) : Endpoint<GetProvidersRequest, IReadOnlyList<RealTimeRpcEndpointDto>>
{
    public override void Configure()
    {
        Get("/api/providers/{Chain}/realtime");
        Policies(AuthorizationPolicies.VIEWER_ONLY);
    }

    public override async Task HandleAsync(GetProvidersRequest req, CancellationToken ct)
    {
        string normalizedChain = req.Chain.Trim().ToLowerInvariant();
        var providers = await dbContext.RealTimeEndpoints.AsNoTracking()
            .Where(x => x.Environment == ApiClientClaimTypes.GetRequiredEnvironment(User) && x.ApplicationId == ApiClientClaimTypes.GetRequiredApplicationId(User) && x.Chain.Name == normalizedChain)
            .OrderByDescending(x => x.ProbedUtc)
            .ThenByDescending(x => x.UpdatedUtc)
            .Select(x => new RealTimeRpcEndpointDto(x.Id, x.Environment, x.Application.Name, x.Chain.Name, x.Provider.Name, x.Address, x.UpdatedUtc, x.ProbedUtc))
            .ToListAsync(ct);

        await Send.OkAsync(providers, ct);
    }
}
