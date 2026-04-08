using Farsight.Common;
using Farsight.RPC.Providers.Contracts;
using Farsight.RPC.Providers.Models;
using Farsight.RPC.Providers.Persistence;
using Farsight.RPC.Providers.Persistence.Entities;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;

namespace Farsight.RPC.Providers.Services;

public partial class ProviderAdminService : Singleton
{
    [Inject] private readonly IDbContextFactory<RpcProvidersDbContext> _dbContextFactory;

    public async Task<ProviderEditModel?> GetEditModelAsync(RpcEndpointType type, Guid id, CancellationToken cancellationToken)
    {
        await using var dbContext = await _dbContextFactory.CreateDbContextAsync(cancellationToken);
        return type switch
        {
            RpcEndpointType.RealTime => await dbContext.RealTimeEndpoints.AsNoTracking().SingleOrDefaultAsync(x => x.Id == id, cancellationToken) is { } entity
                ? new ProviderEditModel { Id = entity.Id, Type = RpcEndpointType.RealTime, Environment = entity.Environment, ApplicationId = entity.ApplicationId, ChainId = entity.ChainId, ProviderId = entity.ProviderId, Address = entity.Address.ToString() }
                : null,
            RpcEndpointType.Archive => await dbContext.ArchiveEndpoints.AsNoTracking().SingleOrDefaultAsync(x => x.Id == id, cancellationToken) is { } archive
                ? new ProviderEditModel { Id = archive.Id, Type = RpcEndpointType.Archive, Environment = archive.Environment, ApplicationId = archive.ApplicationId, ChainId = archive.ChainId, ProviderId = archive.ProviderId, Address = archive.Address.ToString(), IndexerStepSize = archive.IndexerStepSize, DexIndexStepSize = archive.DexIndexStepSize, IndexBlockOffset = archive.IndexBlockOffset }
                : null,
            RpcEndpointType.Tracing => await dbContext.TracingEndpoints.AsNoTracking().SingleOrDefaultAsync(x => x.Id == id, cancellationToken) is { } tracing
                ? new ProviderEditModel { Id = tracing.Id, Type = RpcEndpointType.Tracing, Environment = tracing.Environment, ApplicationId = tracing.ApplicationId, ChainId = tracing.ChainId, ProviderId = tracing.ProviderId, Address = tracing.Address.ToString(), TracingMode = tracing.TracingMode }
                : null,
            _ => throw new ArgumentOutOfRangeException(nameof(type), type, null)
        };
    }

    public async Task SaveAsync(ProviderEditModel model, CancellationToken cancellationToken)
    {
        var now = DateTimeOffset.UtcNow;
        switch(model.Type)
        {
            case RpcEndpointType.RealTime:
                await SaveRealTimeAsync(model, now, cancellationToken);
                break;
            case RpcEndpointType.Archive:
                await SaveArchiveAsync(model, now, cancellationToken);
                break;
            case RpcEndpointType.Tracing:
                await SaveTracingAsync(model, now, cancellationToken);
                break;
            default:
                throw new ArgumentOutOfRangeException(nameof(model), model.Type, null);
        }
    }

    public async Task DeleteAsync(RpcEndpointType type, Guid id, CancellationToken cancellationToken)
    {
        await using var dbContext = await _dbContextFactory.CreateDbContextAsync(cancellationToken);
        switch(type)
        {
            case RpcEndpointType.RealTime:
                await DeleteEntityAsync(dbContext.RealTimeEndpoints, dbContext, id, cancellationToken);
                break;
            case RpcEndpointType.Archive:
                await DeleteEntityAsync(dbContext.ArchiveEndpoints, dbContext, id, cancellationToken);
                break;
            case RpcEndpointType.Tracing:
                await DeleteEntityAsync(dbContext.TracingEndpoints, dbContext, id, cancellationToken);
                break;
            default:
                throw new ArgumentOutOfRangeException(nameof(type), type, null);
        }
    }

    public async Task<IReadOnlyList<ProviderListItem>> GetListAsync(ProviderSelectionModel selection, CancellationToken cancellationToken)
    {
        if(!selection.ApplicationId.HasValue || !selection.ChainId.HasValue)
        {
            return [];
        }

        await using var dbContext = await _dbContextFactory.CreateDbContextAsync(cancellationToken);
        var appId = selection.ApplicationId.Value;
        var chainId = selection.ChainId.Value;

        var rows = new List<ProviderListItem>();
        rows.AddRange(await dbContext.RealTimeEndpoints.AsNoTracking().Include(x => x.Application).Include(x => x.Chain).Include(x => x.Provider)
            .Where(x => x.ApplicationId == appId && x.ChainId == chainId && x.Environment == selection.Environment)
            .Select(x => new ProviderListItem(x.Id, RpcEndpointType.RealTime, x.Environment, x.Application.Name, x.Chain.Name, x.Provider.Name, x.Address, null, null, null, null, x.UpdatedUtc, x.ProbedUtc)).ToListAsync(cancellationToken));
        rows.AddRange(await dbContext.ArchiveEndpoints.AsNoTracking().Include(x => x.Application).Include(x => x.Chain).Include(x => x.Provider)
            .Where(x => x.ApplicationId == appId && x.ChainId == chainId && x.Environment == selection.Environment)
            .Select(x => new ProviderListItem(x.Id, RpcEndpointType.Archive, x.Environment, x.Application.Name, x.Chain.Name, x.Provider.Name, x.Address, x.IndexerStepSize, x.DexIndexStepSize, x.IndexBlockOffset, null, x.UpdatedUtc, x.ProbedUtc)).ToListAsync(cancellationToken));
        rows.AddRange(await dbContext.TracingEndpoints.AsNoTracking().Include(x => x.Application).Include(x => x.Chain).Include(x => x.Provider)
            .Where(x => x.ApplicationId == appId && x.ChainId == chainId && x.Environment == selection.Environment)
            .Select(x => new ProviderListItem(x.Id, RpcEndpointType.Tracing, x.Environment, x.Application.Name, x.Chain.Name, x.Provider.Name, x.Address, null, null, null, x.TracingMode, x.UpdatedUtc, x.ProbedUtc)).ToListAsync(cancellationToken));

        return [.. rows.OrderBy(x => x.Type).ThenBy(x => x.Provider).ThenByDescending(x => x.ProbedUtc).ThenByDescending(x => x.UpdatedUtc)];
    }

    public async Task<IReadOnlyList<LookupItem>> GetApplicationsAsync(CancellationToken cancellationToken)
    {
        await using var dbContext = await _dbContextFactory.CreateDbContextAsync(cancellationToken);
        return await dbContext.Applications.AsNoTracking().OrderBy(x => x.Name).Select(x => new LookupItem(x.Id, x.Name)).ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<LookupItem>> GetChainsAsync(CancellationToken cancellationToken)
    {
        await using var dbContext = await _dbContextFactory.CreateDbContextAsync(cancellationToken);
        return await dbContext.Chains.AsNoTracking().OrderBy(x => x.Name).Select(x => new LookupItem(x.Id, x.Name)).ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<LookupItem>> GetProvidersAsync(CancellationToken cancellationToken)
    {
        await using var dbContext = await _dbContextFactory.CreateDbContextAsync(cancellationToken);
        return await dbContext.Providers.AsNoTracking().OrderBy(x => x.Name).Select(x => new LookupItem(x.Id, x.Name)).ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<ApiClientListItem>> GetApiClientsAsync(CancellationToken cancellationToken)
    {
        await using var dbContext = await _dbContextFactory.CreateDbContextAsync(cancellationToken);
        return await dbContext.ApiClients.AsNoTracking()
            .Include(x => x.Application)
            .OrderBy(x => x.Application!.Name)
            .ThenBy(x => x.Environment)
            .ThenBy(x => x.ApiKey)
            .Select(x => new ApiClientListItem(x.Id, x.ApiKey, x.ApplicationId, x.Application != null ? x.Application.Name : null, x.Environment, x.IsEnabled, x.CreatedUtc, x.UpdatedUtc))
            .ToListAsync(cancellationToken);
    }

    public async Task<ApiClientCreateResult?> CreateApiClientAsync(Guid applicationId, HostEnvironment environment, CancellationToken cancellationToken)
    {
        if(applicationId == Guid.Empty)
        {
            return null;
        }

        await using var dbContext = await _dbContextFactory.CreateDbContextAsync(cancellationToken);
        var now = DateTimeOffset.UtcNow;
        string apiKey = GenerateApiKey();

        var client = new ApiClientEntity
        {
            Id = Guid.NewGuid(),
            ApiKey = apiKey,
            ApplicationId = applicationId,
            Environment = environment,
            IsEnabled = true,
            CreatedUtc = now,
            UpdatedUtc = now
        };
        dbContext.ApiClients.Add(client);
        await dbContext.SaveChangesAsync(cancellationToken);
        return new ApiClientCreateResult(client.Id, apiKey);
    }

    public async Task ToggleApiClientAsync(Guid id, CancellationToken cancellationToken)
    {
        await using var dbContext = await _dbContextFactory.CreateDbContextAsync(cancellationToken);
        var client = await dbContext.ApiClients.SingleAsync(x => x.Id == id, cancellationToken);
        client.IsEnabled = !client.IsEnabled;
        client.UpdatedUtc = DateTimeOffset.UtcNow;
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<ProviderRateLimitRow>> GetProviderRateLimitsAsync(CancellationToken cancellationToken)
    {
        await using var dbContext = await _dbContextFactory.CreateDbContextAsync(cancellationToken);
        return await dbContext.Providers.AsNoTracking()
            .GroupJoin(
                dbContext.ProviderRateLimits.AsNoTracking(),
                provider => provider.Id,
                rateLimit => rateLimit.ProviderId,
                (provider, rateLimits) => new { provider, rateLimit = rateLimits.Select(x => (int?) x.RateLimit).FirstOrDefault() })
            .OrderBy(x => x.provider.Name)
            .Select(x => new ProviderRateLimitRow(x.provider.Id, x.provider.Name, x.rateLimit))
            .ToListAsync(cancellationToken);
    }

    public async Task SaveRateLimitAsync(Guid providerId, int? rateLimit, CancellationToken cancellationToken)
    {
        await using var dbContext = await _dbContextFactory.CreateDbContextAsync(cancellationToken);
        var entity = await dbContext.ProviderRateLimits.SingleOrDefaultAsync(x => x.ProviderId == providerId, cancellationToken);

        if(!rateLimit.HasValue)
        {
            if(entity is not null)
            {
                dbContext.ProviderRateLimits.Remove(entity);
                await dbContext.SaveChangesAsync(cancellationToken);
            }
            return;
        }

        if(rateLimit.Value <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(rateLimit), "Rate limit must be greater than 0.");
        }

        if(entity is null)
        {
            dbContext.ProviderRateLimits.Add(new ProviderRateLimitEntity { ProviderId = providerId, RateLimit = rateLimit.Value });
        }
        else
        {
            entity.RateLimit = rateLimit.Value;
        }
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task SaveApplicationAsync(string name, CancellationToken cancellationToken)
    {
        await using var dbContext = await _dbContextFactory.CreateDbContextAsync(cancellationToken);
        dbContext.Applications.Add(new ApplicationEntity { Id = Guid.NewGuid(), Name = name.Trim() });
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task<bool> SaveChainAsync(string name, CancellationToken cancellationToken)
    {
        await using var dbContext = await _dbContextFactory.CreateDbContextAsync(cancellationToken);
        string normalizedName = name.Trim().ToLowerInvariant();
        if(String.IsNullOrWhiteSpace(normalizedName))
        {
            return false;
        }

        bool exists = await dbContext.Chains.AsNoTracking().AnyAsync(x => x.Name == normalizedName, cancellationToken);
        if(exists)
        {
            return false;
        }

        dbContext.Chains.Add(new ChainEntity { Id = Guid.NewGuid(), Name = normalizedName });
        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> SaveProviderAsync(string name, int? rateLimit, CancellationToken cancellationToken)
    {
        await using var dbContext = await _dbContextFactory.CreateDbContextAsync(cancellationToken);
        string normalizedName = name.Trim();
        if(String.IsNullOrWhiteSpace(normalizedName))
        {
            return false;
        }

        bool exists = await dbContext.Providers.AsNoTracking().AnyAsync(x => x.Name == normalizedName, cancellationToken);
        if(exists)
        {
            return false;
        }

        if(rateLimit.HasValue && rateLimit.Value <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(rateLimit), "Rate limit must be greater than 0.");
        }

        var provider = new ProviderEntity { Id = Guid.NewGuid(), Name = normalizedName };
        dbContext.Providers.Add(provider);

        if(rateLimit.HasValue)
        {
            dbContext.ProviderRateLimits.Add(new ProviderRateLimitEntity { ProviderId = provider.Id, RateLimit = rateLimit.Value });
        }

        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task UpdateProbeResultAsync(RpcEndpointType type, Guid id, bool succeeded, CancellationToken cancellationToken)
    {
        await using var dbContext = await _dbContextFactory.CreateDbContextAsync(cancellationToken);
        DateTimeOffset? probedUtc = succeeded ? DateTimeOffset.UtcNow : null;
        switch(type)
        {
            case RpcEndpointType.RealTime:
                (await dbContext.RealTimeEndpoints.SingleAsync(x => x.Id == id, cancellationToken)).ProbedUtc = probedUtc;
                break;
            case RpcEndpointType.Archive:
                (await dbContext.ArchiveEndpoints.SingleAsync(x => x.Id == id, cancellationToken)).ProbedUtc = probedUtc;
                break;
            case RpcEndpointType.Tracing:
                (await dbContext.TracingEndpoints.SingleAsync(x => x.Id == id, cancellationToken)).ProbedUtc = probedUtc;
                break;
        }
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    private async Task SaveRealTimeAsync(ProviderEditModel model, DateTimeOffset now, CancellationToken cancellationToken)
    {
        await using var dbContext = await _dbContextFactory.CreateDbContextAsync(cancellationToken);
        var entity = model.Id.HasValue ? await dbContext.RealTimeEndpoints.SingleAsync(x => x.Id == model.Id.Value, cancellationToken) : new RealTimeEndpointEntity { Id = Guid.NewGuid() };
        ApplyCommon(entity, model, now);
        if(!model.Id.HasValue)
        {
            dbContext.RealTimeEndpoints.Add(entity);
        }

        await dbContext.SaveChangesAsync(cancellationToken);
    }

    private async Task SaveArchiveAsync(ProviderEditModel model, DateTimeOffset now, CancellationToken cancellationToken)
    {
        await using var dbContext = await _dbContextFactory.CreateDbContextAsync(cancellationToken);
        var entity = model.Id.HasValue ? await dbContext.ArchiveEndpoints.SingleAsync(x => x.Id == model.Id.Value, cancellationToken) : new ArchiveEndpointEntity { Id = Guid.NewGuid() };
        ApplyCommon(entity, model, now);
        entity.IndexerStepSize = model.IndexerStepSize ?? 0;
        entity.DexIndexStepSize = model.DexIndexStepSize;
        entity.IndexBlockOffset = model.IndexBlockOffset ?? 0;
        if(!model.Id.HasValue)
        {
            dbContext.ArchiveEndpoints.Add(entity);
        }

        await dbContext.SaveChangesAsync(cancellationToken);
    }

    private async Task SaveTracingAsync(ProviderEditModel model, DateTimeOffset now, CancellationToken cancellationToken)
    {
        await using var dbContext = await _dbContextFactory.CreateDbContextAsync(cancellationToken);
        var entity = model.Id.HasValue ? await dbContext.TracingEndpoints.SingleAsync(x => x.Id == model.Id.Value, cancellationToken) : new TracingEndpointEntity { Id = Guid.NewGuid() };
        ApplyCommon(entity, model, now);
        entity.TracingMode = model.TracingMode;
        if(!model.Id.HasValue)
        {
            dbContext.TracingEndpoints.Add(entity);
        }

        await dbContext.SaveChangesAsync(cancellationToken);
    }

    private static void ApplyCommon(ProviderEndpointEntity entity, ProviderEditModel model, DateTimeOffset now)
    {
        entity.Environment = model.Environment;
        entity.ApplicationId = model.ApplicationId;
        entity.ChainId = model.ChainId;
        entity.ProviderId = model.ProviderId;
        entity.Address = new Uri(model.Address.Trim(), UriKind.Absolute);
        entity.UpdatedUtc = now;
    }

    public async Task DeleteProviderAsync(Guid id, CancellationToken cancellationToken)
    {
        await using var dbContext = await _dbContextFactory.CreateDbContextAsync(cancellationToken);
        var provider = await dbContext.Providers.SingleAsync(x => x.Id == id, cancellationToken);
        var rateLimit = await dbContext.ProviderRateLimits.SingleOrDefaultAsync(x => x.ProviderId == id, cancellationToken);
        if(rateLimit is not null)
        {
            dbContext.ProviderRateLimits.Remove(rateLimit);
        }
        dbContext.Providers.Remove(provider);
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteChainAsync(Guid id, CancellationToken cancellationToken)
    {
        await using var dbContext = await _dbContextFactory.CreateDbContextAsync(cancellationToken);
        var chain = await dbContext.Chains.SingleAsync(x => x.Id == id, cancellationToken);
        dbContext.Chains.Remove(chain);
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteApplicationAsync(Guid id, CancellationToken cancellationToken)
    {
        await using var dbContext = await _dbContextFactory.CreateDbContextAsync(cancellationToken);
        var app = await dbContext.Applications.SingleAsync(x => x.Id == id, cancellationToken);
        dbContext.Applications.Remove(app);
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    private static async Task DeleteEntityAsync<TEntity>(DbSet<TEntity> set, RpcProvidersDbContext dbContext, Guid id, CancellationToken cancellationToken) where TEntity : ProviderEndpointEntity
    {
        var entity = await set.SingleAsync(x => x.Id == id, cancellationToken);
        set.Remove(entity);
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    private static string GenerateApiKey()
    {
        Span<byte> buffer = stackalloc byte[32];
        RandomNumberGenerator.Fill(buffer);
        return $"frpc_{Convert.ToHexString(buffer).ToLowerInvariant()}";
    }
}
