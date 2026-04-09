using Farsight.Rpc.Api.Auth;
using Farsight.Rpc.Types;
using Farsight.Rpc.Api.Persistence;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;

namespace Farsight.Rpc.Api.Endpoints.Providers;

public sealed class GetProvidersEndpoint(RpcProvidersDbContext dbContext) : Endpoint<GetProvidersRequest, RpcProviderSetDto>
{
    public override void Configure()
    {
        Get("/api/providers/{Chain}");
        Policies(AuthorizationPolicies.VIEWER_ONLY);
    }

    public override async Task HandleAsync(GetProvidersRequest req, CancellationToken ct)
    {
        var environment = ApiClientClaimTypes.GetRequiredEnvironment(User);
        var applicationId = ApiClientClaimTypes.GetRequiredApplicationId(User);
        string chain = req.Chain.Trim();

        var realTime = await dbContext.RealTimeEndpoints.AsNoTracking()
            .Where(x => x.Environment == environment && x.ApplicationId == applicationId && x.Chain == chain)
            .OrderByDescending(x => x.UpdatedUtc)
            .Select(x => new RealTimeRpcEndpointDto(x.Id, x.Environment, x.Application.Name, x.Chain, x.Provider.Name, x.Address, x.UpdatedUtc))
            .ToListAsync(ct);

        var archive = await dbContext.ArchiveEndpoints.AsNoTracking()
            .Where(x => x.Environment == environment && x.ApplicationId == applicationId && x.Chain == chain)
            .OrderByDescending(x => x.UpdatedUtc)
            .Select(x => new ArchiveRpcEndpointDto(x.Id, x.Environment, x.Application.Name, x.Chain, x.Provider.Name, x.Address, x.IndexerStepSize, x.DexIndexStepSize, x.IndexBlockOffset, x.UpdatedUtc))
            .ToListAsync(ct);

        var tracing = await dbContext.TracingEndpoints.AsNoTracking()
            .Where(x => x.Environment == environment && x.ApplicationId == applicationId && x.Chain == chain)
            .OrderByDescending(x => x.UpdatedUtc)
            .Select(x => new TracingRpcEndpointDto(x.Id, x.Environment, x.Application.Name, x.Chain, x.Provider.Name, x.Address, x.TracingMode, x.UpdatedUtc))
            .ToListAsync(ct);

        string application = realTime.FirstOrDefault()?.Application ?? archive.FirstOrDefault()?.Application ?? tracing.FirstOrDefault()?.Application ?? String.Empty;
        await Send.OkAsync(new RpcProviderSetDto(environment, application, chain, realTime, archive, tracing), ct);
    }
}

public sealed record GetProvidersRequest(
    string Chain
);
