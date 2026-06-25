using Farsight.Rpc.Api.Auth;
using Farsight.Rpc.Api.Common;
using Farsight.Rpc.Api.Persistence;
using Farsight.Rpc.Api.Persistence.Entities.Rpc;
using Farsight.Rpc.Api.Services;
using FastEndpoints;
using FluentValidation;
using Microsoft.EntityFrameworkCore;

namespace Farsight.Rpc.Api.Endpoints.Applications.Rpcs;

public sealed class GET(AppDbContext dbContext, PublicRpcRegistry publicRpcRegistry) : Endpoint<GET.Request, RpcEndpoint[]>
{
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

        if(!environment.EnablePublicRpcs)
        {
            await Send.OkAsync(rpcs, ct);
            return;
        }

        var publicRpcs = environment.Chains
            .SelectMany(chain => publicRpcRegistry.GetWorkingRpcs(chain).Select(address => new RpcEndpoint.Public
            {
                Id = Guid.NewGuid(),
                EnvironmentId = req.EnvironmentId,
                Chain = chain,
                Address = address,
                ProviderId = BuiltInRpcProviders.PublicRpcProviderId,
                ApplicationId = req.ApplicationId,
            }));

        await Send.OkAsync([.. rpcs, .. publicRpcs], ct);
    }
}
