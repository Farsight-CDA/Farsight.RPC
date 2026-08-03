using Farsight.Rpc.Api.Cryptography;
using Farsight.Rpc.Api.Persistence;
using Farsight.Rpc.Api.Persistence.Entities;
using Farsight.Rpc.Types;
using FastEndpoints;
using FluentValidation;
using Keysmith.Net.EC;
using Keysmith.Net.ED;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;

namespace Farsight.Rpc.Api.Endpoints.Wallets.Sign;

public sealed class POST(AppDbContext dbContext) : Endpoint<POST.Request, WalletSignResponseDto>
{
    public sealed record Request(
        [property: FromHeader(ApiKeyHeaders.API_KEY)] string ApiKey,
        byte[] Data
    )
    {
        public sealed class Validator : FastEndpoints.Validator<Request>
        {
            public Validator()
            {
                RuleFor(x => x.ApiKey)
                    .NotEmpty()
                    .WithMessage("API key is required.");

                RuleFor(x => x.Data)
                    .NotNull()
                    .WithMessage("Data is required.");
            }
        }
    }

    public override void Configure()
    {
        Post("/api/Wallets/Sign");
        AllowAnonymous();
    }

    public override async Task HandleAsync(Request req, CancellationToken ct)
    {
        var apiKey = await dbContext.WalletApiKeys
            .Include(apiKey => apiKey.WalletPrivateKey)
                .ThenInclude(privateKey => privateKey!.Wallet)
            .SingleOrDefaultAsync(apiKey => apiKey.Key == req.ApiKey, ct);

        if(apiKey is null)
        {
            ThrowError("API key not found.", StatusCodes.Status403Forbidden);
        }

        var privateKey = apiKey.WalletPrivateKey
            ?? throw new InvalidOperationException("The API key has no associated private key.");
        var wallet = privateKey.Wallet
            ?? throw new InvalidOperationException("The private key has no associated wallet.");
        byte[] data = req.Data;

        if(privateKey.Curve == WalletCurve.Secp256k1 && data.Length != 32)
        {
            ThrowError("Secp256k1 signing requires exactly 32 bytes of data.", StatusCodes.Status400BadRequest);
        }

        byte[] signature = SignData(privateKey, wallet.Mnemonic, data);

        apiKey.LastUsedAt = DateTimeOffset.UtcNow;
        await dbContext.SaveChangesAsync(ct);

        await Send.OkAsync(new WalletSignResponseDto(signature), ct);
    }

    private static byte[] SignData(WalletPrivateKey privateKey, string mnemonic, ReadOnlySpan<byte> data)
    {
        byte[] privateKeyBytes = WalletKeyDerivation.DerivePrivateKey(
            privateKey.Curve,
            mnemonic,
            privateKey.DerivationPath
        );

        try
        {
            switch(privateKey.Curve)
            {
                case WalletCurve.Secp256k1:
                    byte[] secp256k1Signature = new byte[Secp256k1.Instance.RecoverableSignatureLength];
                    Secp256k1.Instance.SignRecoverable(privateKeyBytes, data, secp256k1Signature);
                    return secp256k1Signature;
                case WalletCurve.Ed25519:
                    byte[] ed25519Signature = new byte[ED25519.Instance.SignatureLength];
                    ED25519.Instance.Sign(privateKeyBytes, data, ed25519Signature);
                    return ed25519Signature;
                default:
                    throw new InvalidOperationException($"Unsupported wallet curve '{privateKey.Curve}'.");
            }
        }
        finally
        {
            CryptographicOperations.ZeroMemory(privateKeyBytes);
        }
    }
}
