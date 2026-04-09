using Farsight.Rpc.Api.Models;
using Farsight.Rpc.Api.Persistence;
using Farsight.Rpc.Api.Persistence.Entities;
using Farsight.Rpc.Types;
using Microsoft.EntityFrameworkCore;

namespace Farsight.Rpc.Api.Endpoints.Admin.Rpcs;

internal static class RpcDbHelpers
{
    public static async Task<ProviderEditModel?> GetEditModelAsync(RpcProvidersDbContext dbContext, RpcEndpointType type, Guid id, CancellationToken cancellationToken)
        => type switch
        {
            RpcEndpointType.RealTime => await dbContext.RealTimeEndpoints.AsNoTracking().SingleOrDefaultAsync(x => x.Id == id, cancellationToken) is { } entity
                ? new ProviderEditModel { Id = entity.Id, Type = RpcEndpointType.RealTime, Environment = entity.Environment, ApplicationId = entity.ApplicationId, Chain = entity.Chain, ProviderId = entity.ProviderId, Address = entity.Address.ToString() }
                : null,
            RpcEndpointType.Archive => await dbContext.ArchiveEndpoints.AsNoTracking().SingleOrDefaultAsync(x => x.Id == id, cancellationToken) is { } archive
                ? new ProviderEditModel { Id = archive.Id, Type = RpcEndpointType.Archive, Environment = archive.Environment, ApplicationId = archive.ApplicationId, Chain = archive.Chain, ProviderId = archive.ProviderId, Address = archive.Address.ToString(), IndexerStepSize = archive.IndexerStepSize, DexIndexStepSize = archive.DexIndexStepSize, IndexBlockOffset = archive.IndexBlockOffset }
                : null,
            RpcEndpointType.Tracing => await dbContext.TracingEndpoints.AsNoTracking().SingleOrDefaultAsync(x => x.Id == id, cancellationToken) is { } tracing
                ? new ProviderEditModel { Id = tracing.Id, Type = RpcEndpointType.Tracing, Environment = tracing.Environment, ApplicationId = tracing.ApplicationId, Chain = tracing.Chain, ProviderId = tracing.ProviderId, Address = tracing.Address.ToString(), TracingMode = tracing.TracingMode }
                : null,
            _ => throw new ArgumentOutOfRangeException(nameof(type), type, null)
        };

    public static async Task SaveRpcAsync(RpcProvidersDbContext dbContext, ProviderEditModel model, CancellationToken cancellationToken)
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

    private static void ApplyCommon(ProviderEndpointEntity entity, ProviderEditModel model, DateTimeOffset now)
    {
        entity.Environment = model.Environment;
        entity.ApplicationId = model.ApplicationId;
        entity.Chain = model.Chain;
        entity.ProviderId = model.ProviderId;
        entity.Address = new Uri(model.Address.Trim(), UriKind.Absolute);
        entity.UpdatedUtc = now;
    }
}
