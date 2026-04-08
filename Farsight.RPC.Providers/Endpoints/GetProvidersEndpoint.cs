using Farsight.RPC.Providers.Auth;
using Farsight.RPC.Providers.Contracts;
using Farsight.RPC.Providers.Persistence;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;

namespace Farsight.RPC.Providers.Endpoints;

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
        string normalizedChain = req.Chain.Trim().ToLowerInvariant();

        var realTime = await dbContext.RealTimeEndpoints.AsNoTracking()
            .Where(x => x.Environment == environment && x.ApplicationId == applicationId && x.Chain.Name == normalizedChain)
            .OrderByDescending(x => x.ProbedUtc)
            .ThenByDescending(x => x.UpdatedUtc)
            .Select(x => new RealTimeRpcEndpointDto(x.Id, x.Environment, x.Application.Name, x.Chain.Name, x.Provider.Name, x.Address, x.UpdatedUtc, x.ProbedUtc))
            .ToListAsync(ct);

        var archive = await dbContext.ArchiveEndpoints.AsNoTracking()
            .Where(x => x.Environment == environment && x.ApplicationId == applicationId && x.Chain.Name == normalizedChain)
            .OrderByDescending(x => x.ProbedUtc)
            .ThenByDescending(x => x.UpdatedUtc)
            .Select(x => new ArchiveRpcEndpointDto(x.Id, x.Environment, x.Application.Name, x.Chain.Name, x.Provider.Name, x.Address, x.IndexerStepSize, x.DexIndexStepSize, x.IndexBlockOffset, x.UpdatedUtc, x.ProbedUtc))
            .ToListAsync(ct);

        var tracing = await dbContext.TracingEndpoints.AsNoTracking()
            .Where(x => x.Environment == environment && x.ApplicationId == applicationId && x.Chain.Name == normalizedChain)
            .OrderByDescending(x => x.ProbedUtc)
            .ThenByDescending(x => x.UpdatedUtc)
            .Select(x => new TracingRpcEndpointDto(x.Id, x.Environment, x.Application.Name, x.Chain.Name, x.Provider.Name, x.Address, x.TracingMode, x.UpdatedUtc, x.ProbedUtc))
            .ToListAsync(ct);

        string application = realTime.FirstOrDefault()?.Application ?? archive.FirstOrDefault()?.Application ?? tracing.FirstOrDefault()?.Application ?? String.Empty;
        await Send.OkAsync(new RpcProviderSetDto(environment, application, normalizedChain, realTime, archive, tracing), ct);
    }
}

public sealed record GetProvidersRequest(string Chain);
