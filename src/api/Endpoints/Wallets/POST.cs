using Farsight.Rpc.Api.Auth;
using Farsight.Rpc.Api.Common.Extensions;
using Farsight.Rpc.Api.Persistence;
using Farsight.Rpc.Api.Persistence.Entities;
using FastEndpoints;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace Farsight.Rpc.Api.Endpoints.Wallets;

public sealed class POST(AppDbContext dbContext) : Endpoint<POST.Request, POST.Response>
{
    public sealed record Request(
        string Name,
        string Mnemonic,
        string Color
    )
    {
        public sealed class Validator : FastEndpoints.Validator<Request>
        {
            public Validator()
            {
                RuleFor(x => x.Name).ApplyNameValidation();
                RuleFor(x => x.Mnemonic)
                    .NotEmpty()
                    .WithMessage("Mnemonic is required.")
                    .Must(static mnemonic => !String.IsNullOrWhiteSpace(mnemonic))
                    .WithMessage("Mnemonic is required.");

                RuleFor(x => x.Color).ApplyColorValidation();
            }
        }
    }

    public new sealed record Response(
        Guid Id,
        string Name,
        string Color
    );

    public override void Configure()
    {
        Post("/api/Wallets");
        Roles(AuthRoles.ADMIN);
    }

    public override async Task HandleAsync(Request req, CancellationToken ct)
    {
        var wallet = new Wallet
        {
            Id = Guid.NewGuid(),
            Name = req.Name,
            Mnemonic = req.Mnemonic,
            Color = req.Color,
        };

        dbContext.Wallets.Add(wallet);
        try
        {
            await dbContext.SaveChangesAsync(ct);
        }
        catch(DbUpdateException ex) when(ex.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation })
        {
            ThrowError("A wallet with this name already exists.", StatusCodes.Status409Conflict);
        }

        await Send.OkAsync(new Response(wallet.Id, wallet.Name, wallet.Color), ct);
    }
}
