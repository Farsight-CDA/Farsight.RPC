using Farsight.Rpc.Api.Auth;
using Farsight.Rpc.Api.Persistence;
using Farsight.Rpc.Api.Persistence.Entities;
using Farsight.Rpc.Api.Validation;
using Farsight.Rpc.Types;
using FastEndpoints;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace Farsight.Rpc.Api.Endpoints.RpcErrorGroups;

public sealed class POST(AppDbContext dbContext) : Endpoint<POST.Request>
{
    public sealed record Request(
        string Name,
        RpcErrorAction Action,
        string[] Errors
    );

    public sealed class Validator : Validator<Request>
    {
        public Validator()
        {
            RuleFor(x => x.Name).ApplyNameValidation();

            RuleFor(x => x.Action)
                .IsInEnum()
                .WithMessage("Invalid action value.");

            RuleFor(x => x.Errors)
                .NotNull()
                .WithMessage("Errors are required.");

            RuleForEach(x => x.Errors)
                .Cascade(CascadeMode.Stop)
                .NotEmpty()
                .WithMessage("Error values cannot be empty.")
                .Must(value => value.Trim() == value)
                .WithMessage("Error values cannot have leading or trailing whitespace.");
        }
    }

    public override void Configure()
    {
        Post("/api/RpcErrorGroups");
        Roles(AuthRoles.ADMIN);
    }

    public override async Task HandleAsync(Request req, CancellationToken ct)
    {
        if(await dbContext.RpcErrorGroups.AnyAsync(group => group.Name == req.Name, ct))
        {
            ThrowError("An RPC error group with this name already exists.", 409);
        }

        var group = new RpcErrorGroup
        {
            Id = Guid.NewGuid(),
            Name = req.Name,
            Action = req.Action,
            Errors = [.. req.Errors.Distinct()],
        };

        dbContext.RpcErrorGroups.Add(group);

        try
        {
            await dbContext.SaveChangesAsync(ct);
        }
        catch(DbUpdateException ex) when(ex.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation })
        {
            ThrowError("An RPC error group with this name already exists.", 409);
        }

        await Send.NoContentAsync(ct);
    }
}
