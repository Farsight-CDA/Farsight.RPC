using Farsight.Rpc.Api.Auth;
using Farsight.Rpc.Api.Persistence;
using Farsight.Rpc.Types;
using FastEndpoints;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace Farsight.Rpc.Api.Endpoints.Applications.Rpcs;

public sealed class PUT(AppDbContext dbContext) : Endpoint<PUT.Request>
{
    public sealed record Request(
        [property: RouteParam] Guid ApplicationId,
        [property: RouteParam] Guid RpcId,
        Guid? ProviderId,
        RpcCapability[]? Capabilities
    );

    public sealed class Validator : Validator<Request>
    {
        public Validator()
        {
            RuleFor(x => x)
                .Must(x => x.ProviderId is not null || x.Capabilities is not null)
                .WithMessage("At least one field (ProviderId or Capabilities) must be provided.");

            When(
                x => x.ProviderId is not null,
                () => RuleFor(x => x.ProviderId)
                    .NotEmpty()
                    .WithMessage("Provider must not be empty."));

            When(
                x => x.Capabilities is not null,
                () =>
                {
                    RuleFor(x => x.Capabilities!)
                        .Must(static capabilities => capabilities.Distinct().Count() == capabilities.Length)
                        .WithMessage("Capabilities must not contain duplicates.");

                    RuleForEach(x => x.Capabilities!)
                        .IsInEnum()
                        .WithMessage("Capability is invalid.");
                });
        }
    }

    public override void Configure()
    {
        Put("/api/Applications/{ApplicationId}/Rpcs/{RpcId}");
        Roles(AuthRoles.ADMIN);
    }

    public override async Task HandleAsync(Request req, CancellationToken ct)
    {
        var rpc = await dbContext.Rpcs
            .SingleOrDefaultAsync(rpc => rpc.ApplicationId == req.ApplicationId && rpc.Id == req.RpcId, ct);

        if(rpc is null)
        {
            ThrowError("RPC not found.", 404);
        }

        if(req.ProviderId is Guid providerId)
        {
            rpc.ProviderId = providerId;
        }

        if(req.Capabilities is { } capabilities)
        {
            rpc.Capabilities = capabilities;
        }

        try
        {
            await dbContext.SaveChangesAsync(ct);
        }
        catch(DbUpdateException ex) when(ex.InnerException is PostgresException
        {
            SqlState: PostgresErrorCodes.ForeignKeyViolation,
            ConstraintName: "FK_Rpcs_RpcProviders_ProviderId",
        })
        {
            ThrowError("RPC provider not found.", 404);
        }

        await Send.NoContentAsync(ct);
    }
}
