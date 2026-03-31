using Farsight.RPC.Providers.Contracts;
using Farsight.RPC.Providers.Data;
using Farsight.RPC.Providers.Data.Entities;
using Farsight.RPC.Providers.Models;
using Microsoft.EntityFrameworkCore;

namespace Farsight.RPC.Providers.Services;

public sealed class ProviderAdminService(RpcProvidersDbContext dbContext)
{
    public async Task<ProviderEditModel?> GetEditModelAsync(RpcEndpointType type, Guid id, CancellationToken cancellationToken)
    {
        return type switch
        {
            RpcEndpointType.RealTime => Map(await dbContext.RealTimeEndpoints.AsNoTracking().SingleOrDefaultAsync(x => x.Id == id, cancellationToken)),
            RpcEndpointType.Archive => Map(await dbContext.ArchiveEndpoints.AsNoTracking().SingleOrDefaultAsync(x => x.Id == id, cancellationToken)),
            RpcEndpointType.Tracing => Map(await dbContext.TracingEndpoints.AsNoTracking().SingleOrDefaultAsync(x => x.Id == id, cancellationToken)),
            _ => throw new ArgumentOutOfRangeException(nameof(type), type, null)
        };
    }

    public async Task SaveAsync(ProviderEditModel model, CancellationToken cancellationToken)
    {
        var now = DateTimeOffset.UtcNow;
        switch (model.Type)
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
                throw new ArgumentOutOfRangeException(nameof(model.Type), model.Type, null);
        }
    }

    public async Task DeleteAsync(RpcEndpointType type, Guid id, CancellationToken cancellationToken)
    {
        switch (type)
        {
            case RpcEndpointType.RealTime:
                await DeleteAsync(dbContext.RealTimeEndpoints, id, cancellationToken);
                break;
            case RpcEndpointType.Archive:
                await DeleteAsync(dbContext.ArchiveEndpoints, id, cancellationToken);
                break;
            case RpcEndpointType.Tracing:
                await DeleteAsync(dbContext.TracingEndpoints, id, cancellationToken);
                break;
        }
    }

    public async Task<IReadOnlyList<ProviderListItem>> GetListAsync(ProviderListQuery query, CancellationToken cancellationToken)
    {
        var rows = new List<ProviderListItem>();
        rows.AddRange(await dbContext.RealTimeEndpoints.AsNoTracking().Select(x => new ProviderListItem(x.Id, RpcEndpointType.RealTime, x.Environment, x.Application, x.Chain, x.Provider, x.Address, x.Priority, x.IsEnabled, null, null, null, null, x.UpdatedUtc)).ToListAsync(cancellationToken));
        rows.AddRange(await dbContext.ArchiveEndpoints.AsNoTracking().Select(x => new ProviderListItem(x.Id, RpcEndpointType.Archive, x.Environment, x.Application, x.Chain, x.Provider, x.Address, x.Priority, x.IsEnabled, x.IndexerStepSize, x.DexIndexStepSize, x.IndexBlockOffset, null, x.UpdatedUtc)).ToListAsync(cancellationToken));
        rows.AddRange(await dbContext.TracingEndpoints.AsNoTracking().Select(x => new ProviderListItem(x.Id, RpcEndpointType.Tracing, x.Environment, x.Application, x.Chain, x.Provider, x.Address, x.Priority, x.IsEnabled, null, null, null, x.TracingMode, x.UpdatedUtc)).ToListAsync(cancellationToken));

        IEnumerable<ProviderListItem> filtered = rows;

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            filtered = filtered.Where(x =>
                x.Application.Contains(query.Search, StringComparison.OrdinalIgnoreCase)
                || x.Chain.Contains(query.Search, StringComparison.OrdinalIgnoreCase)
                || x.Provider.Contains(query.Search, StringComparison.OrdinalIgnoreCase)
                || x.Address.ToString().Contains(query.Search, StringComparison.OrdinalIgnoreCase));
        }

        if (query.Environment.HasValue)
        {
            filtered = filtered.Where(x => x.Environment == query.Environment.Value);
        }

        if (query.Type.HasValue)
        {
            filtered = filtered.Where(x => x.Type == query.Type.Value);
        }

        filtered = query.Sort switch
        {
            ProviderSort.Chain => filtered.OrderBy(x => x.Chain).ThenBy(x => x.Application).ThenBy(x => x.Type),
            ProviderSort.Type => filtered.OrderBy(x => x.Type).ThenBy(x => x.Application).ThenBy(x => x.Chain),
            _ => filtered.OrderBy(x => x.Application).ThenBy(x => x.Chain).ThenBy(x => x.Type)
        };

        return filtered.ToArray();
    }

    private async Task SaveRealTimeAsync(ProviderEditModel model, DateTimeOffset now, CancellationToken cancellationToken)
    {
        var entity = model.Id.HasValue
            ? await dbContext.RealTimeEndpoints.SingleAsync(x => x.Id == model.Id.Value, cancellationToken)
            : new RealTimeEndpointEntity { Id = Guid.NewGuid(), CreatedUtc = now };

        ApplyCommon(entity, model, now);
        if (model.Id is null)
        {
            dbContext.RealTimeEndpoints.Add(entity);
        }

        await dbContext.SaveChangesAsync(cancellationToken);
    }

    private async Task SaveArchiveAsync(ProviderEditModel model, DateTimeOffset now, CancellationToken cancellationToken)
    {
        var entity = model.Id.HasValue
            ? await dbContext.ArchiveEndpoints.SingleAsync(x => x.Id == model.Id.Value, cancellationToken)
            : new ArchiveEndpointEntity { Id = Guid.NewGuid(), CreatedUtc = now };

        ApplyCommon(entity, model, now);
        entity.IndexerStepSize = model.IndexerStepSize ?? 0;
        entity.DexIndexStepSize = model.DexIndexStepSize;
        entity.IndexBlockOffset = model.IndexBlockOffset ?? 0;
        if (model.Id is null)
        {
            dbContext.ArchiveEndpoints.Add(entity);
        }

        await dbContext.SaveChangesAsync(cancellationToken);
    }

    private async Task SaveTracingAsync(ProviderEditModel model, DateTimeOffset now, CancellationToken cancellationToken)
    {
        var entity = model.Id.HasValue
            ? await dbContext.TracingEndpoints.SingleAsync(x => x.Id == model.Id.Value, cancellationToken)
            : new TracingEndpointEntity { Id = Guid.NewGuid(), CreatedUtc = now };

        ApplyCommon(entity, model, now);
        entity.TracingMode = model.TracingMode;
        if (model.Id is null)
        {
            dbContext.TracingEndpoints.Add(entity);
        }

        await dbContext.SaveChangesAsync(cancellationToken);
    }

    private static void ApplyCommon(ProviderEndpointEntity entity, ProviderEditModel model, DateTimeOffset now)
    {
        entity.Environment = model.Environment;
        entity.Application = model.Application.Trim();
        entity.Chain = model.Chain.Trim();
        entity.Provider = model.Provider.Trim();
        entity.Address = new Uri(model.Address.Trim(), UriKind.Absolute);
        entity.Priority = model.Priority;
        entity.IsEnabled = model.IsEnabled;
        entity.UpdatedUtc = now;
    }

    private async Task DeleteAsync<TEntity>(DbSet<TEntity> set, Guid id, CancellationToken cancellationToken) where TEntity : ProviderEndpointEntity
    {
        var entity = await set.SingleAsync(x => x.Id == id, cancellationToken);
        set.Remove(entity);
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    private static ProviderEditModel? Map(RealTimeEndpointEntity? entity)
        => entity is null ? null : new ProviderEditModel
        {
            Id = entity.Id,
            Type = RpcEndpointType.RealTime,
            Environment = entity.Environment,
            Application = entity.Application,
            Chain = entity.Chain,
            Provider = entity.Provider,
            Address = entity.Address.ToString(),
            Priority = entity.Priority,
            IsEnabled = entity.IsEnabled
        };

    private static ProviderEditModel? Map(ArchiveEndpointEntity? entity)
        => entity is null ? null : new ProviderEditModel
        {
            Id = entity.Id,
            Type = RpcEndpointType.Archive,
            Environment = entity.Environment,
            Application = entity.Application,
            Chain = entity.Chain,
            Provider = entity.Provider,
            Address = entity.Address.ToString(),
            Priority = entity.Priority,
            IsEnabled = entity.IsEnabled,
            IndexerStepSize = entity.IndexerStepSize,
            DexIndexStepSize = entity.DexIndexStepSize,
            IndexBlockOffset = entity.IndexBlockOffset
        };

    private static ProviderEditModel? Map(TracingEndpointEntity? entity)
        => entity is null ? null : new ProviderEditModel
        {
            Id = entity.Id,
            Type = RpcEndpointType.Tracing,
            Environment = entity.Environment,
            Application = entity.Application,
            Chain = entity.Chain,
            Provider = entity.Provider,
            Address = entity.Address.ToString(),
            Priority = entity.Priority,
            IsEnabled = entity.IsEnabled,
            TracingMode = entity.TracingMode
        };
}
