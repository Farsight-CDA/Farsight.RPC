using Farsight.Rpc.Api.Auth;
using Farsight.Rpc.Api.Persistence;
using Farsight.Rpc.Api.Persistence.Entities.Rpc;
using Farsight.Rpc.Types;
using FastEndpoints;
using FluentValidation;
using Microsoft.EntityFrameworkCore;

namespace Farsight.Rpc.Api.Endpoints.Rpcs;

public sealed class GET(AppDbContext dbContext) : Endpoint<GET.Request, RpcEndpoint[]>
{
    public sealed class Request
    {
        [RouteParam]
        public Guid ApplicationId { get; init; }

        [RouteParam]
        public required string Environment { get; init; }
    }

    public sealed class Validator : AbstractValidator<Request>
    {
        public Validator()
        {
            RuleFor(x => x.Environment)
                .Cascade(CascadeMode.Stop)
                .Must(static environment => !String.IsNullOrWhiteSpace(environment))
                .WithMessage("Environment is required.")
                .Must(static environment => Enum.TryParse<HostEnvironment>(environment, true, out _))
                .WithMessage("Environment is invalid.");
        }
    }

    public override void Configure()
    {
        Get("/api/applications/{applicationId}/rpcs/{environment}");
        Roles(AuthRoles.ADMIN);
    }

    public override async Task HandleAsync(Request req, CancellationToken ct)
    {
        if(!Enum.TryParse<HostEnvironment>(req.Environment, true, out var environment))
        {
            ThrowError("Environment is invalid.");
        }

        if(!await dbContext.ConsumerApplications.AnyAsync(a => a.Id == req.ApplicationId, ct))
        {
            ThrowError("Application not found.", 404);
        }

        var rpcs = await dbContext.Rpcs
            .AsNoTracking()
            .Where(rpc => rpc.ApplicationId == req.ApplicationId && rpc.Environment == environment)
            .OrderBy(rpc => rpc.Chain)
            .ThenBy(rpc => EF.Property<string>(rpc, "RpcType"))
            .ThenBy(rpc => rpc.Id)
            .ToArrayAsync(ct);

        await Send.OkAsync(rpcs, ct);
    }
}
