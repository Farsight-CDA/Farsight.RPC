using Farsight.Common.Extensions;
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
            .Where(environment => environment.ApplicationId == key.ApplicationId && environment.Id == key.EnvironmentId)
            .Select(environment => new { environment.Chains, environment.EnablePublicRpcs })
            .SingleAsync(ct);

        var rpcs = await dbContext.Rpcs
            .AsNoTracking()
            .Where(rpc => rpc.ApplicationId == key.ApplicationId && rpc.EnvironmentId == key.EnvironmentId && environment.Chains.Contains(rpc.Chain))
            .OrderBy(rpc => rpc.Chain)
            .ThenBy(rpc => rpc.Order)
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
            .AsImmutable();

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

        var publicRpcs = environment.EnablePublicRpcs
            ? environment.Chains
                .Select(chain => new { Chain = chain, Rpcs = publicRpcRegistry.GetWorkingRpcs(chain) })
                .Where(group => group.Rpcs.Length > 0)
                .ToDictionary(group => group.Chain, group => group.Rpcs)
            : [];

        await Send.OkAsync(new ApiKeyRpcsDto(
            responseRpcs,
            publicRpcs,
            environment.EnablePublicRpcs ? publicRpcRegistry.LastUpdatedAt : null,
            providers,
            errorGroups
        ), ct);
    }

    private static RpcEndpointDto MapRpc(RpcEndpoint rpc)
        => new()
        {
            Id = rpc.Id,
            Address = rpc.Address,
            ProviderId = rpc.ProviderId,
            Capabilities = rpc.Capabilities,
            EthGetLogsLimit = rpc.EthGetLogsLimit,
            Order = rpc.Order,
        };
}
