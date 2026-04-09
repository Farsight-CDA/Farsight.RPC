using Farsight.Rpc.Api.Auth;
using Farsight.Rpc.Types;
using Farsight.Rpc.Api.Persistence;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;

namespace Farsight.Rpc.Api.Endpoints;

public sealed class GetTracingProvidersEndpoint(RpcProvidersDbContext dbContext) : Endpoint<GetProvidersRequest, IReadOnlyList<TracingRpcEndpointDto>>
{
    public override void Configure()
    {
        Get("/api/providers/{Chain}/tracing");
        Policies(AuthorizationPolicies.VIEWER_ONLY);
    }

    public override async Task HandleAsync(GetProvidersRequest req, CancellationToken ct)
    {
        string normalizedChain = req.Chain.Trim().ToLowerInvariant();
        var providers = await dbContext.TracingEndpoints.AsNoTracking()
            .Where(x => x.Environment == ApiClientClaimTypes.GetRequiredEnvironment(User) && x.ApplicationId == ApiClientClaimTypes.GetRequiredApplicationId(User) && x.Chain.Name == normalizedChain)
            .OrderByDescending(x => x.UpdatedUtc)
            .Select(x => new TracingRpcEndpointDto(x.Id, x.Environment, x.Application.Name, x.Chain.Name, x.Provider.Name, x.Address, x.TracingMode, x.UpdatedUtc))
            .ToListAsync(ct);

        await Send.OkAsync(providers, ct);
    }
}
