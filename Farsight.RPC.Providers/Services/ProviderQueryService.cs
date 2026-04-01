using Farsight.Common;
using Farsight.RPC.Providers.Contracts;
using Farsight.RPC.Providers.Data;
using Microsoft.EntityFrameworkCore;

namespace Farsight.RPC.Providers.Services;

public partial class ProviderQueryService : Singleton
{
    [Inject] private readonly IDbContextFactory<RpcProvidersDbContext> _dbContextFactory;

    public async Task<RpcProviderSetDto> GetProviderSetAsync(HostEnvironment environment, string application, string chain, CancellationToken cancellationToken)
    {
        var realTime = await GetRealTimeAsync(environment, application, chain, cancellationToken);
        var archive = await GetArchiveAsync(environment, application, chain, cancellationToken);
        var tracing = await GetTracingAsync(environment, application, chain, cancellationToken);

        return new RpcProviderSetDto(environment, application, chain, realTime, archive, tracing);
    }

    public async Task<List<RealTimeRpcEndpointDto>> GetRealTimeAsync(HostEnvironment environment, string application, string chain, CancellationToken cancellationToken)
    {
        await using var dbContext = await _dbContextFactory.CreateDbContextAsync(cancellationToken);
        return await dbContext.RealTimeEndpoints
            .AsNoTracking()
            .Where(x => x.Environment == environment && x.Application == application && x.Chain == chain && x.IsEnabled)
            .OrderBy(x => x.Priority)
            .ThenBy(x => x.Provider)
            .Select(x => new RealTimeRpcEndpointDto(x.Id, x.Environment, x.Application, x.Chain, x.Provider, x.Address, x.Priority, x.IsEnabled, x.UpdatedUtc))
            .ToListAsync(cancellationToken);
    }

    public async Task<List<ArchiveRpcEndpointDto>> GetArchiveAsync(HostEnvironment environment, string application, string chain, CancellationToken cancellationToken)
    {
        await using var dbContext = await _dbContextFactory.CreateDbContextAsync(cancellationToken);
        return await dbContext.ArchiveEndpoints
            .AsNoTracking()
            .Where(x => x.Environment == environment && x.Application == application && x.Chain == chain && x.IsEnabled)
            .OrderBy(x => x.Priority)
            .ThenBy(x => x.Provider)
            .Select(x => new ArchiveRpcEndpointDto(x.Id, x.Environment, x.Application, x.Chain, x.Provider, x.Address, x.Priority, x.IsEnabled, x.IndexerStepSize, x.DexIndexStepSize, x.IndexBlockOffset, x.UpdatedUtc))
            .ToListAsync(cancellationToken);
    }

    public async Task<List<TracingRpcEndpointDto>> GetTracingAsync(HostEnvironment environment, string application, string chain, CancellationToken cancellationToken)
    {
        await using var dbContext = await _dbContextFactory.CreateDbContextAsync(cancellationToken);
        return await dbContext.TracingEndpoints
            .AsNoTracking()
            .Where(x => x.Environment == environment && x.Application == application && x.Chain == chain && x.IsEnabled)
            .OrderBy(x => x.Priority)
            .ThenBy(x => x.Provider)
            .Select(x => new TracingRpcEndpointDto(x.Id, x.Environment, x.Application, x.Chain, x.Provider, x.Address, x.Priority, x.IsEnabled, x.TracingMode, x.UpdatedUtc))
            .ToListAsync(cancellationToken);
    }
}
