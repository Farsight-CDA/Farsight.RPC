using Farsight.Rpc.Api.Auth;
using Farsight.Rpc.Api.Persistence;
using Farsight.Rpc.Api.Persistence.Entities;
using Farsight.Rpc.Api.Validation;
using Farsight.Rpc.Types;
using FastEndpoints;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace Farsight.Rpc.Api.Endpoints.Applications;

public sealed class POST(AppDbContext dbContext) : Endpoint<POST.Request>
{
    public sealed record Request(
        string Name,
        RpcStructureDefinition? Structure,
        string Color
    );

    public sealed class Validator : Validator<Request>
    {
        public Validator()
        {
            RuleFor(x => x.Name).ApplyNameValidation();

            RuleFor(x => x.Structure)
                .NotNull()
                .WithMessage("Structure is required.");

            RuleFor(x => x.Color)
                .NotEmpty()
                .WithMessage("Color is required.")
                .Matches(@"^#[0-9A-Fa-f]{6}$")
                .WithMessage("Color must be a valid hex color code (e.g. #FF5722).");
        }
    }

    public override void Configure()
    {
        Post("/api/Applications");
        Roles(AuthRoles.ADMIN);
    }

    public override async Task HandleAsync(Request req, CancellationToken ct)
    {
        if(await dbContext.ConsumerApplications.AnyAsync(a => a.Name == req.Name, ct))
        {
            ThrowError("An application with this name already exists.", 409);
        }

        var application = new ConsumerApplication
        {
            Id = Guid.NewGuid(),
            Name = req.Name,
            Structure = req.Structure ?? RpcStructureDefinition.Default,
            Color = req.Color,
        };

        dbContext.ConsumerApplications.Add(application);
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
