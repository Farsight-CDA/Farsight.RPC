using Farsight.Rpc.Api.Auth;
using Farsight.Rpc.Api.Persistence;
using Farsight.Rpc.Api.Validation;
using Farsight.Rpc.Types;
using FastEndpoints;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace Farsight.Rpc.Api.Endpoints.RpcErrorGroups;

public sealed class PUT(AppDbContext dbContext) : Endpoint<PUT.Request>
{
    public sealed record Request(
        [property: RouteParam] Guid RpcErrorGroupId,
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
        Put("/api/RpcErrorGroups/{RpcErrorGroupId}");
        Roles(AuthRoles.ADMIN);
    }

    public override async Task HandleAsync(Request req, CancellationToken ct)
    {
        var group = await dbContext.RpcErrorGroups
            .SingleOrDefaultAsync(group => group.Id == req.RpcErrorGroupId, ct);

        if(group is null)
        {
            ThrowError("RPC error group not found.", 404);
        }

        if(await dbContext.RpcErrorGroups.AnyAsync(group => group.Id != req.RpcErrorGroupId && group.Name == req.Name, ct))
        {
            ThrowError("An RPC error group with this name already exists.", 409);
        }

        group.Name = req.Name;
        group.Action = req.Action;
        group.Errors = [.. req.Errors.Distinct()];

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
