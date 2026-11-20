using Farsight.Rpc.Api.Auth;
using Farsight.Rpc.Api.Persistence;
using Farsight.Rpc.Api.Services;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;

namespace Farsight.Rpc.Api.Endpoints.Wallets.PrivateKeys.Key;

public sealed class GET(AppDbContext dbContext, WalletKeyDerivation keyDerivation) : Endpoint<GET.Request, GET.Response>
{
    public sealed record Request(
        [property: RouteParam] Guid WalletId,
        [property: RouteParam] Guid PrivateKeyId
    );

    public new sealed record Response(
        byte[] Key
    );

    public override void Configure()
    {
        Get("/api/Wallets/{WalletId}/PrivateKeys/{PrivateKeyId}/Key");
        Roles(AuthRoles.ADMIN);
    }

    public override async Task HandleAsync(Request req, CancellationToken ct)
    {
        var privateKey = await dbContext.WalletPrivateKeys
            .AsNoTracking()
            .Where(privateKey => privateKey.WalletId == req.WalletId && privateKey.Id == req.PrivateKeyId)
            .Select(privateKey => new
            {
                privateKey.Curve,
                privateKey.DerivationPath,
                privateKey.Wallet!.EncryptedMnemonic,
            })
            .SingleOrDefaultAsync(ct);

        if(privateKey is null)
        {
            ThrowError("Private key not found.", StatusCodes.Status404NotFound);
        }

        byte[] key = keyDerivation.DerivePrivateKey(
            privateKey.Curve,
            privateKey.EncryptedMnemonic,
            privateKey.DerivationPath
        );

        try
        {
            HttpContext.Response.Headers.CacheControl = "no-store";
            await Send.OkAsync(new Response(key), ct);
        }
        finally
        {
            CryptographicOperations.ZeroMemory(key);
        }
    }
}
