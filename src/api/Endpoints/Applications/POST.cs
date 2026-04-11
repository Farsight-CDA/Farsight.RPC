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
        RpcStructureType[] Structures
    );

    public sealed class Validator : Validator<Request>
    {
        public Validator()
        {
            RuleFor(x => x.Name).ApplyNameValidation();

            RuleFor(x => x.Structures)
                .NotNull()
                .WithMessage("Structures is required.")
                .IsInEnum()
                .WithMessage("Invalid structure value.");
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
            Structures = [.. req.Structures.Distinct()],
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
