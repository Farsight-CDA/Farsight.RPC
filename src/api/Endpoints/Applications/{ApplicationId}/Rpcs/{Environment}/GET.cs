using Farsight.Rpc.Api.Auth;
using Farsight.Rpc.Api.Persistence;
using Farsight.Rpc.Api.Persistence.Entities.Rpc;
using FastEndpoints;
using FluentValidation;
using Microsoft.EntityFrameworkCore;

namespace Farsight.Rpc.Api.Endpoints.Applications.Rpcs;

public sealed class GET(AppDbContext dbContext) : Endpoint<GET.Request, RpcEndpoint[]>
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

        if(!await dbContext.ApplicationEnvironments.AnyAsync(environment => environment.ApplicationId == req.ApplicationId && environment.Id == req.EnvironmentId, ct))
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

        await Send.OkAsync(rpcs, ct);
    }
}
