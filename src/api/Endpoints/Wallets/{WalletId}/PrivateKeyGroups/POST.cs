using Farsight.Rpc.Api.Auth;
using Farsight.Rpc.Api.Common.Extensions;
using Farsight.Rpc.Api.Persistence;
using Farsight.Rpc.Api.Persistence.Entities;
using FastEndpoints;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace Farsight.Rpc.Api.Endpoints.Wallets.PrivateKeyGroups;

public sealed class POST(AppDbContext dbContext) : Endpoint<POST.Request, POST.Response>
{
    public sealed record Request(
        [property: RouteParam] Guid WalletId,
        string Name,
        string Description
    )
    {
        public sealed class Validator : FastEndpoints.Validator<Request>
        {
            public Validator()
            {
                RuleFor(x => x.Name).ApplyNameValidation();
                RuleFor(x => x.Description)
                    .NotNull()
                    .WithMessage("Description is required.");
            }
        }
    }

    public new sealed record Response(
        Guid Id,
        string Name,
        string Description
    );

    public override void Configure()
    {
        Post("/api/Wallets/{WalletId}/PrivateKeyGroups");
        Roles(AuthRoles.ADMIN);
    }

    public override async Task HandleAsync(Request req, CancellationToken ct)
    {
        var group = new WalletPrivateKeyGroup
        {
            Id = Guid.NewGuid(),
            WalletId = req.WalletId,
            Name = req.Name,
            Description = req.Description,
        };

        dbContext.WalletPrivateKeyGroups.Add(group);

        try
        {
            await dbContext.SaveChangesAsync(ct);
        }
        catch(DbUpdateException ex) when(ex.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation })
        {
            ThrowError("A private key group with this name already exists in the wallet.", StatusCodes.Status409Conflict);
        }
        catch(DbUpdateException ex) when(ex.InnerException is PostgresException { SqlState: PostgresErrorCodes.ForeignKeyViolation })
        {
            ThrowError("Wallet not found.", StatusCodes.Status404NotFound);
        }

        await Send.OkAsync(new Response(group.Id, group.Name, group.Description), ct);
    }
}
