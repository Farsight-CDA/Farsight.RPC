using Farsight.Common;
using Farsight.RPC.Providers.Contracts;
using Farsight.RPC.Providers.Data;
using Microsoft.EntityFrameworkCore;

namespace Farsight.RPC.Providers.Services;

public partial class ProviderQueryService : Singleton
{
    [Inject] private readonly IDbContextFactory<RpcProvidersDbContext> _dbContextFactory;

    public async Task<RpcProviderSetDto> GetProviderSetAsync(HostEnvironment environment, Guid applicationId, string chain, CancellationToken cancellationToken)
    {
        var realTime = await GetRealTimeAsync(environment, applicationId, chain, cancellationToken);
        var archive = await GetArchiveAsync(environment, applicationId, chain, cancellationToken);
        var tracing = await GetTracingAsync(environment, applicationId, chain, cancellationToken);
        string application = realTime.FirstOrDefault()?.Application ?? archive.FirstOrDefault()?.Application ?? tracing.FirstOrDefault()?.Application ?? String.Empty;
        return new RpcProviderSetDto(environment, application, chain, realTime, archive, tracing);
    }

    public async Task<List<RealTimeRpcEndpointDto>> GetRealTimeAsync(HostEnvironment environment, Guid applicationId, string chain, CancellationToken cancellationToken)
    {
        await using var dbContext = await _dbContextFactory.CreateDbContextAsync(cancellationToken);
        string normalizedChain = chain.Trim().ToLowerInvariant();
        return await dbContext.RealTimeEndpoints.AsNoTracking()
            .Include(x => x.Application).Include(x => x.Chain).Include(x => x.Provider)
            .Where(x => x.Environment == environment && x.ApplicationId == applicationId && x.Chain.Name == normalizedChain)
            .OrderByDescending(x => x.ProbedUtc).ThenByDescending(x => x.UpdatedUtc)
            .Select(x => new RealTimeRpcEndpointDto(x.Id, x.Environment, x.Application.Name, x.Chain.Name, x.Provider.Name, x.Address, x.UpdatedUtc, x.ProbedUtc))
            .ToListAsync(cancellationToken);
    }

    public async Task<List<ArchiveRpcEndpointDto>> GetArchiveAsync(HostEnvironment environment, Guid applicationId, string chain, CancellationToken cancellationToken)
    {
        await using var dbContext = await _dbContextFactory.CreateDbContextAsync(cancellationToken);
        string normalizedChain = chain.Trim().ToLowerInvariant();
        return await dbContext.ArchiveEndpoints.AsNoTracking()
            .Include(x => x.Application).Include(x => x.Chain).Include(x => x.Provider)
            .Where(x => x.Environment == environment && x.ApplicationId == applicationId && x.Chain.Name == normalizedChain)
            .OrderByDescending(x => x.ProbedUtc).ThenByDescending(x => x.UpdatedUtc)
            .Select(x => new ArchiveRpcEndpointDto(x.Id, x.Environment, x.Application.Name, x.Chain.Name, x.Provider.Name, x.Address, x.IndexerStepSize, x.DexIndexStepSize, x.IndexBlockOffset, x.UpdatedUtc, x.ProbedUtc))
            .ToListAsync(cancellationToken);
    }

    public async Task<List<TracingRpcEndpointDto>> GetTracingAsync(HostEnvironment environment, Guid applicationId, string chain, CancellationToken cancellationToken)
    {
        await using var dbContext = await _dbContextFactory.CreateDbContextAsync(cancellationToken);
        string normalizedChain = chain.Trim().ToLowerInvariant();
        return await dbContext.TracingEndpoints.AsNoTracking()
            .Include(x => x.Application).Include(x => x.Chain).Include(x => x.Provider)
            .Where(x => x.Environment == environment && x.ApplicationId == applicationId && x.Chain.Name == normalizedChain)
            .OrderByDescending(x => x.ProbedUtc).ThenByDescending(x => x.UpdatedUtc)
            .Select(x => new TracingRpcEndpointDto(x.Id, x.Environment, x.Application.Name, x.Chain.Name, x.Provider.Name, x.Address, x.TracingMode, x.UpdatedUtc, x.ProbedUtc))
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<ProviderRateLimitDto>> GetRateLimitsAsync(CancellationToken cancellationToken)
    {
        await using var dbContext = await _dbContextFactory.CreateDbContextAsync(cancellationToken);
        return await dbContext.ProviderRateLimits.AsNoTracking()
            .Include(x => x.Provider)
            .OrderBy(x => x.Provider.Name)
            .Select(x => new ProviderRateLimitDto(x.Provider.Name, x.RateLimit))
            .ToListAsync(cancellationToken);
    }
}
