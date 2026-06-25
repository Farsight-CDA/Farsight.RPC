using Farsight.Common.Extensions;
using Farsight.Rpc.Api.Common;
using Farsight.Rpc.Api.Persistence;
using Farsight.Rpc.Api.Persistence.Entities.Rpc;
using Farsight.Rpc.Api.Services;
using Farsight.Rpc.Types;
using FastEndpoints;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using System.Collections.Immutable;

namespace Farsight.Rpc.Api.Endpoints.Rpcs;

public sealed class GET(AppDbContext dbContext, PublicRpcRegistry publicRpcRegistry) : Endpoint<GET.Request, ApiKeyRpcsDto>
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

        var environment = await dbContext.ApplicationEnvironments
            .AsNoTracking()
            .SingleAsync(environment => environment.ApplicationId == key.ApplicationId && environment.Id == key.EnvironmentId, ct);

        var rpcs = await dbContext.Rpcs
            .AsNoTracking()
            .Where(rpc => rpc.ApplicationId == key.ApplicationId && rpc.EnvironmentId == key.EnvironmentId && environment.Chains.Contains(rpc.Chain))
            .OrderBy(rpc => rpc.Chain)
            .ThenBy(rpc => EF.Property<string>(rpc, "RpcType"))
            .ThenBy(rpc => rpc.Id)
            .ToArrayAsync(ct);

        var providerIds = rpcs
            .Select(rpc => rpc.ProviderId)
            .Distinct()
            .ToArray();

        var providers = (await dbContext.RpcProviders
            .AsNoTracking()
            .Where(provider => providerIds.Contains(provider.Id))
            .OrderBy(provider => provider.Name)
            .Select(provider => new RpcProviderDto(
                provider.Id,
                provider.Name,
                provider.RateLimit
            ))
            .ToArrayAsync(ct))
            .ToImmutableArray();

        var publicRpcProvider = environment.EnablePublicRpcs
            ? await dbContext.RpcProviders
                .AsNoTracking()
                .Where(provider => provider.Id == BuiltInRpcProviders.PublicRpcProviderId)
                .Select(provider => new RpcProviderDto(
                    provider.Id,
                    provider.Name,
                    provider.RateLimit
                ))
                .SingleAsync(ct)
            : null;

        var errorGroups = (await dbContext.RpcErrorGroups
            .AsNoTracking()
            .OrderBy(group => group.Name)
            .Select(group => new RpcErrorGroupDto(group.Id, group.Name, group.Action, group.Errors))
            .ToArrayAsync(ct))
            .AsImmutable();

        key.LastUsedAt = DateTimeOffset.UtcNow;
        await dbContext.SaveChangesAsync(ct);

        var responseRpcs = rpcs
            .GroupBy(rpc => rpc.Chain)
            .ToDictionary(group => group.Key, group => group.Select(MapRpc).ToImmutableArray());

        if(environment.EnablePublicRpcs)
        {
            var publicRpcCount = 0;

            foreach(string chain in environment.Chains)
            {
                var publicRpcs = publicRpcRegistry.GetWorkingRpcs(chain)
                    .Select(address => new RpcEndpointDto.Public
                    {
                        Id = Guid.NewGuid(),
                        Address = address,
                        ProviderId = BuiltInRpcProviders.PublicRpcProviderId,
                    })
                    .Cast<RpcEndpointDto>()
                    .ToImmutableArray();

                publicRpcCount += publicRpcs.Length;

                responseRpcs[chain] = responseRpcs.TryGetValue(chain, out var existingRpcs)
                    ? existingRpcs.AddRange(publicRpcs)
                    : publicRpcs;
            }

            if(publicRpcCount > 0 && publicRpcProvider is not null)
            {
                providers = providers.Add(publicRpcProvider);
            }
        }

        await Send.OkAsync(new ApiKeyRpcsDto(
            responseRpcs,
            providers,
            errorGroups
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
