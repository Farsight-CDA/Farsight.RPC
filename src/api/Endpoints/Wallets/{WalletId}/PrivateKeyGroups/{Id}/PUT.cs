using Farsight.Rpc.Api.Auth;
using Farsight.Rpc.Api.Common.Extensions;
using Farsight.Rpc.Api.Persistence;
using FastEndpoints;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace Farsight.Rpc.Api.Endpoints.Wallets.PrivateKeyGroups;

public sealed class PUT(AppDbContext dbContext) : Endpoint<PUT.Request>
{
    public sealed record Request(
        [property: RouteParam] Guid WalletId,
        [property: RouteParam] Guid PrivateKeyGroupId,
        string? Name,
        string? Description
    )
    {
        public sealed class Validator : FastEndpoints.Validator<Request>
        {
            public Validator()
            {
                When(
                    x => x.Name is not null,
                    () => RuleFor(x => x.Name).ApplyNameValidation()
                );
            }
        }
    }

    public override void Configure()
    {
        Put("/api/Wallets/{WalletId}/PrivateKeyGroups/{PrivateKeyGroupId}");
        Roles(AuthRoles.ADMIN);
    }

    public override async Task HandleAsync(Request req, CancellationToken ct)
    {
        var group = await dbContext.WalletPrivateKeyGroups
            .SingleOrDefaultAsync(group => group.WalletId == req.WalletId && group.Id == req.PrivateKeyGroupId, ct);

        if(group is null)
        {
            ThrowError("Private key group not found.", StatusCodes.Status404NotFound);
        }

        if(req.Name is not null)
        {
            group.Name = req.Name;
        }
        if(req.Description is not null)
        {
            group.Description = req.Description;
        }

        try
        {
            await dbContext.SaveChangesAsync(ct);
        }
        catch(DbUpdateException ex) when(ex.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation })
        {
            ThrowError("A private key group with this name already exists in the wallet.", StatusCodes.Status409Conflict);
        }

        await Send.NoContentAsync(ct);
    }
}
