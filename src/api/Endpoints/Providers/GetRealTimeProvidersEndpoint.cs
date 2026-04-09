using Farsight.Rpc.Api.Auth;
using Farsight.Rpc.Types;
using Farsight.Rpc.Api.Persistence;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;

namespace Farsight.Rpc.Api.Endpoints.Providers;

public sealed class GetRealTimeProvidersEndpoint(RpcProvidersDbContext dbContext) : Endpoint<GetProvidersRequest, IReadOnlyList<RealTimeRpcEndpointDto>>
{
    public override void Configure()
    {
        Get("/api/providers/{Chain}/realtime");
        Policies(AuthorizationPolicies.VIEWER_ONLY);
    }

    public override async Task HandleAsync(GetProvidersRequest req, CancellationToken ct)
    {
        string chain = req.Chain.Trim();
        var providers = await dbContext.RealTimeEndpoints.AsNoTracking()
            .Where(x => x.Environment == ApiClientClaimTypes.GetRequiredEnvironment(User) && x.ApplicationId == ApiClientClaimTypes.GetRequiredApplicationId(User) && x.Chain == chain)
            .OrderByDescending(x => x.UpdatedUtc)
            .Select(x => new RealTimeRpcEndpointDto(x.Id, x.Environment, x.Application.Name, x.Chain, x.Provider.Name, x.Address, x.UpdatedUtc))
            .ToListAsync(ct);

        await Send.OkAsync(providers, ct);
    }
}
