using Farsight.Rpc.Api.Auth;
using Farsight.Rpc.Api.Cryptography;
using Farsight.Rpc.Api.Persistence;
using Farsight.Rpc.Api.Persistence.Entities;
using FastEndpoints;
using FluentValidation;
using Keysmith.Net.BIP;
using Keysmith.Net.SLIP;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace Farsight.Rpc.Api.Endpoints.Wallets.PrivateKeys;

public sealed class POST(AppDbContext dbContext) : Endpoint<POST.Request, POST.Response>
{
    public sealed record Request(
        [property: RouteParam] Guid WalletId,
        WalletCurve? Curve,
        string DerivationPath
    )
    {
        public sealed class Validator : FastEndpoints.Validator<Request>
        {
            public Validator()
            {
                RuleFor(x => x.Curve)
                    .Cascade(CascadeMode.Stop)
                    .NotNull()
                    .WithMessage("Wallet curve is required.")
                    .Must(static curve => Enum.IsDefined(curve!.Value))
                    .WithMessage("Invalid wallet curve value.");

                RuleFor(x => x.DerivationPath)
                    .Cascade(CascadeMode.Stop)
                    .NotEmpty()
                    .WithMessage("Derivation path is required.")
                    .Must(IsValidDerivationPath)
                    .WithMessage("Derivation path must be valid for the selected wallet curve.");
            }

            private static bool IsValidDerivationPath(Request request, string derivationPath)
            {
                uint[] path = new uint[BIP44.GetPathLength(derivationPath)];
                return BIP44.TryParse(derivationPath, path, out _)
                    && (request.Curve != WalletCurve.Ed25519 || path.All(index => index >= Slip10.HardenedOffset));
            }
        }
    }

    public new sealed record Response(
        Guid Id,
        WalletCurve Curve,
        string DerivationPath,
        byte[] PublicKey
    );

    public override void Configure()
    {
        Post("/api/Wallets/{WalletId}/PrivateKeys");
        Roles(AuthRoles.ADMIN);
    }

    public override async Task HandleAsync(Request req, CancellationToken ct)
    {
        string? mnemonic = await dbContext.Wallets
            .Where(wallet => wallet.Id == req.WalletId)
            .Select(wallet => wallet.Mnemonic)
            .SingleOrDefaultAsync(ct);

        if(mnemonic is null)
        {
            ThrowError("Wallet not found.", StatusCodes.Status404NotFound);
        }

        string derivationPath = BIP44.MakePath(BIP44.Parse(req.DerivationPath));

        var privateKey = new WalletPrivateKey
        {
            Id = Guid.NewGuid(),
            WalletId = req.WalletId,
            Curve = req.Curve!.Value,
            DerivationPath = derivationPath,
            PublicKey = WalletKeyDerivation.DerivePublicKey(req.Curve.Value, mnemonic, derivationPath),
        };

        dbContext.WalletPrivateKeys.Add(privateKey);

        try
        {
            await dbContext.SaveChangesAsync(ct);
        }
        catch(DbUpdateException ex) when(ex.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation })
        {
            ThrowError("A key with this curve and derivation path already exists in the wallet.", StatusCodes.Status409Conflict);
        }

        await Send.OkAsync(new Response(
            privateKey.Id,
            privateKey.Curve,
            privateKey.DerivationPath,
            privateKey.PublicKey
        ), ct);
    }
}
