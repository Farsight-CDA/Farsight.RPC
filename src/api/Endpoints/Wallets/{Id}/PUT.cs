using Farsight.Rpc.Api.Auth;
using Farsight.Rpc.Api.Common.Extensions;
using Farsight.Rpc.Api.Persistence;
using FastEndpoints;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace Farsight.Rpc.Api.Endpoints.Wallets;

public sealed class PUT(AppDbContext dbContext) : Endpoint<PUT.Request>
{
    public sealed record Request(
        [property: RouteParam] Guid WalletId,
        string? Name,
        string? Color
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

                When(
                    x => x.Color is not null,
                    () => RuleFor(x => x.Color).ApplyColorValidation()
                );
            }
        }
    }

    public override void Configure()
    {
        Put("/api/Wallets/{WalletId}");
        Roles(AuthRoles.ADMIN);
    }

    public override async Task HandleAsync(Request req, CancellationToken ct)
    {
        var wallet = await dbContext.Wallets
            .SingleOrDefaultAsync(wallet => wallet.Id == req.WalletId, ct);

        if(wallet is null)
        {
            ThrowError("Wallet not found.", StatusCodes.Status404NotFound);
        }

        if(req.Name is not null)
        {
            wallet.Name = req.Name;
        }
        if(req.Color is not null)
        {
            wallet.Color = req.Color;
        }

        try
        {
            await dbContext.SaveChangesAsync(ct);
        }
        catch(DbUpdateException ex) when(ex.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation })
        {
            ThrowError("A wallet with this name already exists.", StatusCodes.Status409Conflict);
        }

        await Send.NoContentAsync(ct);
    }
}
