using Farsight.Rpc.Api.Auth;
using Farsight.Rpc.Api.Persistence;
using Farsight.Rpc.Api.Persistence.Entities.Rpc;
using Farsight.Rpc.Api.Services;
using Farsight.Rpc.Types;
using FastEndpoints;
using FluentValidation;
using Microsoft.EntityFrameworkCore;

namespace Farsight.Rpc.Api.Endpoints.Applications.Rpcs;

public sealed class GET(AppDbContext dbContext, PublicRpcRegistry publicRpcRegistry) : Endpoint<GET.Request, GET.RpcSummary[]>
{
    public sealed record RpcSummary(
        string Type,
        Guid Id,
        Guid EnvironmentId,
        string Chain,
        Uri Address,
        Guid ProviderId,
        Guid ApplicationId,
        TracingMode? TracingMode = null,
        ulong? IndexerStepSize = null,
        ulong? IndexerBlockOffset = null
    );

    public sealed record Request(
        [property: RouteParam] Guid ApplicationId,
        [property: RouteParam] Guid EnvironmentId
    );

    public sealed class Validator : Validator<Request>
    {
        public Validator()
        {
            RuleFor(x => x.EnvironmentId)
                .Must(static environmentId => environmentId != Guid.Empty)
                .WithMessage("Environment is required.");
        }
    }

    public override void Configure()
    {
        Get("/api/Applications/{ApplicationId}/Rpcs/{EnvironmentId}");
        Roles(AuthRoles.ADMIN);
    }

    public override async Task HandleAsync(Request req, CancellationToken ct)
    {
        if(!await dbContext.ConsumerApplications.AnyAsync(a => a.Id == req.ApplicationId, ct))
        {
            ThrowError("Application not found.", 404);
        }

        var environment = await dbContext.ApplicationEnvironments
            .AsNoTracking()
            .SingleOrDefaultAsync(environment => environment.ApplicationId == req.ApplicationId && environment.Id == req.EnvironmentId, ct);

        if(environment is null)
        {
            ThrowError("Environment not found.", 404);
        }

        var rpcs = await dbContext.Rpcs
            .AsNoTracking()
            .Where(rpc => rpc.ApplicationId == req.ApplicationId && rpc.EnvironmentId == req.EnvironmentId)
            .OrderBy(rpc => rpc.Chain)
            .ThenBy(rpc => EF.Property<string>(rpc, "RpcType"))
            .ThenBy(rpc => rpc.Id)
            .ToArrayAsync(ct);

        var responseRpcs = rpcs.Select(MapRpc).ToArray();

        if(!environment.EnablePublicRpcs)
        {
            await Send.OkAsync(responseRpcs, ct);
            return;
        }

        var publicRpcs = environment.Chains
            .SelectMany(chain => publicRpcRegistry.GetWorkingRpcs(chain).Select(address => new RpcSummary(
                nameof(RpcType.Public),
                Guid.NewGuid(),
                req.EnvironmentId,
                chain,
                address,
                Guid.Empty,
                req.ApplicationId
            )));

        await Send.OkAsync([.. responseRpcs, .. publicRpcs], ct);
    }

    private static RpcSummary MapRpc(RpcEndpoint rpc)
        => rpc switch
        {
            RpcEndpoint.Realtime realtime => new RpcSummary(nameof(RpcType.Realtime), realtime.Id, realtime.EnvironmentId, realtime.Chain, realtime.Address, realtime.ProviderId, realtime.ApplicationId),
            RpcEndpoint.Archive archive => new RpcSummary(nameof(RpcType.Archive), archive.Id, archive.EnvironmentId, archive.Chain, archive.Address, archive.ProviderId, archive.ApplicationId, IndexerStepSize: archive.IndexerStepSize, IndexerBlockOffset: archive.IndexerBlockOffset),
            RpcEndpoint.Tracing tracing => new RpcSummary(nameof(RpcType.Tracing), tracing.Id, tracing.EnvironmentId, tracing.Chain, tracing.Address, tracing.ProviderId, tracing.ApplicationId, TracingMode: tracing.TracingMode),
            _ => throw new NotSupportedException($"Unsupported RPC type '{rpc.GetType().Name}'.")
        };
}
