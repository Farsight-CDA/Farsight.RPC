using Farsight.Rpc.Api.Persistence;
using Farsight.Rpc.Api.Persistence.Entities.Rpc;
using Farsight.Rpc.Types;
using FastEndpoints;
using FluentValidation;
using Microsoft.EntityFrameworkCore;

namespace Farsight.Rpc.Api.Endpoints.Rpcs;

public sealed class GET(AppDbContext dbContext) : Endpoint<GET.Request, ApiKeyRpcsDto>
{
    public sealed record Request(
        [property: FromHeader(ApiKeyHeaders.API_KEY)] string ApiKey
    );

    public sealed class Validator : Validator<Request>
    {
        public Validator()
        {
            RuleFor(x => x.ApiKey)
                .NotNull()
                .WithMessage("API key is required.");
        }
    }

    public override void Configure()
    {
        Get("/api/Rpcs");
        AllowAnonymous();
    }

    public override async Task HandleAsync(Request req, CancellationToken ct)
    {
        var key = await dbContext.ConsumerApiKeys
            .Where(k => k.Key == req.ApiKey)
            .SingleOrDefaultAsync(ct);

        if(key is null)
        {
            ThrowError("API key not found.", 403);
        }

        string[] activeChains = await dbContext.ApplicationEnvironments
            .AsNoTracking()
            .Where(environment => environment.ApplicationId == key.ApplicationId && environment.Id == key.EnvironmentId)
            .Select(environment => environment.Chains)
            .SingleAsync(ct);

        var rpcs = await dbContext.Rpcs
            .AsNoTracking()
            .Where(rpc => rpc.ApplicationId == key.ApplicationId && rpc.EnvironmentId == key.EnvironmentId && activeChains.Contains(rpc.Chain))
            .OrderBy(rpc => rpc.Chain)
            .ThenBy(rpc => EF.Property<string>(rpc, "RpcType"))
            .ThenBy(rpc => rpc.Id)
            .ToArrayAsync(ct);

        var providerIds = rpcs
            .Select(rpc => rpc.ProviderId)
            .Distinct()
            .ToArray();

        var providers = await dbContext.RpcProviders
            .AsNoTracking()
            .Where(provider => providerIds.Contains(provider.Id))
            .OrderBy(provider => provider.Name)
            .Select(provider => new RpcProviderDto(
                provider.Id,
                provider.Name,
                provider.RateLimit
            ))
            .ToArrayAsync(ct);

        key.LastUsedAt = DateTimeOffset.UtcNow;
        await dbContext.SaveChangesAsync(ct);

        await Send.OkAsync(new ApiKeyRpcsDto(
            rpcs.GroupBy(rpc => rpc.Chain)
                .ToDictionary(group => group.Key, group => group.Select(MapRpc).ToArray()),
            providers
        ), ct);
    }

    private static RpcEndpointDto MapRpc(RpcEndpoint rpc)
        => rpc switch
        {
            RpcEndpoint.Realtime realtime => new RpcEndpointDto.Realtime
            {
                Id = realtime.Id,
                Address = realtime.Address,
                ProviderId = realtime.ProviderId,
            },
            RpcEndpoint.Archive archive => new RpcEndpointDto.Archive
            {
                Id = archive.Id,
                Address = archive.Address,
                ProviderId = archive.ProviderId,
                IndexerStepSize = archive.IndexerStepSize,
                DexIndexerStepSize = archive.DexIndexerStepSize,
                IndexerBlockOffset = archive.IndexerBlockOffset,
            },
            RpcEndpoint.Tracing tracing => new RpcEndpointDto.Tracing
            {
                Id = tracing.Id,
                Address = tracing.Address,
                ProviderId = tracing.ProviderId,
                TracingMode = tracing.TracingMode,
            },
            _ => throw new NotSupportedException($"Unsupported RPC type '{rpc.GetType().Name}'.")
        };
}
