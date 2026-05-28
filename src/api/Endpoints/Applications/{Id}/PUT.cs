using Farsight.Rpc.Api.Auth;
using Farsight.Rpc.Api.Persistence;
using Farsight.Rpc.Api.Validation;
using Farsight.Rpc.Types;
using FastEndpoints;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace Farsight.Rpc.Api.Endpoints.Applications;

public sealed class PUT(AppDbContext dbContext) : Endpoint<PUT.Request>
{
    public sealed record Request(
        [property: RouteParam] Guid ApplicationId,
        string? Name,
        RpcStructureDefinition? Structure,
        string? Color
    );

    public sealed class Validator : Validator<Request>
    {
        public Validator()
        {
            RuleFor(x => x)
                .Must(x => x.Name is not null || x.Color is not null || x.Structure is not null)
                .WithMessage("At least one field (Name, Color, Structure) must be provided.");

            When(
                x => x.Name is not null,
                () => RuleFor(x => x.Name!).ApplyNameValidation()
            );

            When(
                x => x.Color is not null,
                () => RuleFor(x => x.Color!)
                    .Matches(@"^#[0-9A-Fa-f]{6}$")
                    .WithMessage("Color must be a valid hex color code (e.g. #FF5722).")
                );
        }
    }

    public override void Configure()
    {
        Put("/api/Applications/{ApplicationId}");
        Roles(AuthRoles.ADMIN);
    }

    public override async Task HandleAsync(Request req, CancellationToken ct)
    {
        var application = await dbContext.ConsumerApplications
            .SingleOrDefaultAsync(a => a.Id == req.ApplicationId, ct);

        if(application is null)
        {
            ThrowError("Application not found.", 404);
        }

        if(req.Name is not null)
        {
            if(await dbContext.ConsumerApplications.AnyAsync(a => a.Id != req.ApplicationId && a.Name == req.Name, ct))
            {
                ThrowError("An application with this name already exists.", 409);
            }
            application.Name = req.Name;
        }

        if(req.Color is not null)
        {
            application.Color = req.Color;
        }

        if(req.Structure is not null)
        {
            application.Structure = req.Structure;
        }

        try
        {
            await dbContext.SaveChangesAsync(ct);
        }
        catch(DbUpdateException ex) when(ex.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation })
        {
            ThrowError("An application with this name already exists.", 409);
        }
        await Send.NoContentAsync(ct);
    }
}
