using Farsight.Rpc.Api.Models;
using Farsight.Rpc.Api.Persistence;
using Farsight.Rpc.Api.Persistence.Entities;
using Farsight.Rpc.Types;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;

namespace Farsight.Rpc.Api.Endpoints.Admin;

internal static class AdminEndpointDbHelpers
{
    public static async Task<ProviderEditModel?> GetEditModelAsync(RpcProvidersDbContext dbContext, RpcEndpointType type, Guid id, CancellationToken cancellationToken)
        => type switch
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

    public static async Task<IReadOnlyList<ProviderListItem>> GetListAsync(RpcProvidersDbContext dbContext, ProviderSelectionModel selection, CancellationToken cancellationToken)
    {
        if(!selection.ApplicationId.HasValue || !selection.ChainId.HasValue)
        {
            return [];
        }

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

    public static async Task SaveEndpointAsync(RpcProvidersDbContext dbContext, ProviderEditModel model, CancellationToken cancellationToken)
    {
        var now = DateTimeOffset.UtcNow;
        switch(model.Type)
        {
            case RpcEndpointType.RealTime:
            {
                var entity = model.Id.HasValue ? await dbContext.RealTimeEndpoints.SingleAsync(x => x.Id == model.Id.Value, cancellationToken) : new RealTimeEndpointEntity { Id = Guid.NewGuid() };
                ApplyCommon(entity, model, now);
                if(!model.Id.HasValue)
                {
                    dbContext.RealTimeEndpoints.Add(entity);
                }
                break;
            }
            case RpcEndpointType.Archive:
            {
                var entity = model.Id.HasValue ? await dbContext.ArchiveEndpoints.SingleAsync(x => x.Id == model.Id.Value, cancellationToken) : new ArchiveEndpointEntity { Id = Guid.NewGuid() };
                ApplyCommon(entity, model, now);
                entity.IndexerStepSize = model.IndexerStepSize ?? 0;
                entity.DexIndexStepSize = model.DexIndexStepSize;
                entity.IndexBlockOffset = model.IndexBlockOffset ?? 0;
                if(!model.Id.HasValue)
                {
                    dbContext.ArchiveEndpoints.Add(entity);
                }
                break;
            }
            case RpcEndpointType.Tracing:
            {
                var entity = model.Id.HasValue ? await dbContext.TracingEndpoints.SingleAsync(x => x.Id == model.Id.Value, cancellationToken) : new TracingEndpointEntity { Id = Guid.NewGuid() };
                ApplyCommon(entity, model, now);
                entity.TracingMode = model.TracingMode;
                if(!model.Id.HasValue)
                {
                    dbContext.TracingEndpoints.Add(entity);
                }
                break;
            }
            default:
                throw new ArgumentOutOfRangeException(nameof(model), model.Type, null);
        }

        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public static async Task DeleteEndpointAsync(RpcProvidersDbContext dbContext, RpcEndpointType type, Guid id, CancellationToken cancellationToken)
    {
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

    public static async Task UpdateProbeResultAsync(RpcProvidersDbContext dbContext, RpcEndpointType type, Guid id, bool succeeded, CancellationToken cancellationToken)
    {
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

    public static string GenerateApiKey()
    {
        Span<byte> buffer = stackalloc byte[32];
        RandomNumberGenerator.Fill(buffer);
        return $"frpc_{Convert.ToHexString(buffer).ToLowerInvariant()}";
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

    private static async Task DeleteEntityAsync<TEntity>(DbSet<TEntity> set, RpcProvidersDbContext dbContext, Guid id, CancellationToken cancellationToken) where TEntity : ProviderEndpointEntity
    {
        var entity = await set.SingleAsync(x => x.Id == id, cancellationToken);
        set.Remove(entity);
        await dbContext.SaveChangesAsync(cancellationToken);
    }
}
