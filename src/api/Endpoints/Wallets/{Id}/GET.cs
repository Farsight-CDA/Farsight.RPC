using Farsight.Rpc.Api.Auth;
using Farsight.Rpc.Api.Cryptography;
using Farsight.Rpc.Api.Persistence;
using Farsight.Rpc.Api.Persistence.Entities;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;

namespace Farsight.Rpc.Api.Endpoints.Wallets;

public sealed class GETById(AppDbContext dbContext) : Endpoint<GETById.Request, GETById.Response>
{
    public sealed record ApiKeySummary(
        Guid Id,
        string Name,
        DateTimeOffset? LastUsedAt
    );

    public sealed record PrivateKeySummary(
        Guid Id,
        WalletCurve Curve,
        string DerivationPath,
        byte[] PublicKey,
        WalletAddressFormat AddressFormat,
        string Address,
        ApiKeySummary[] ApiKeys,
        Guid GroupId
    );

    public sealed record PrivateKeyGroupSummary(
        Guid Id,
        string Name,
        string Description
    );

    public sealed record Request(
        [property: RouteParam] Guid WalletId
    );

    public new sealed record Response(
        Guid Id,
        string Name,
        string Color,
        PrivateKeySummary[] PrivateKeys,
        PrivateKeyGroupSummary[] PrivateKeyGroups
    );

    public override void Configure()
    {
        Get("/api/Wallets/{WalletId}");
        Roles(AuthRoles.ADMIN);
    }

    public override async Task HandleAsync(Request req, CancellationToken ct)
    {
        var wallet = await dbContext.Wallets
            .AsNoTracking()
            .Where(wallet => wallet.Id == req.WalletId)
            .Select(wallet => new { wallet.Id, wallet.Name, wallet.Color })
            .SingleOrDefaultAsync(ct);

        if(wallet is null)
        {
            ThrowError("Wallet not found.", StatusCodes.Status404NotFound);
        }

        var privateKeys = await dbContext.WalletPrivateKeys
            .AsNoTracking()
            .Where(privateKey => privateKey.WalletId == req.WalletId)
            .OrderBy(privateKey => privateKey.Curve)
            .ThenBy(privateKey => privateKey.DerivationPath)
            .Select(privateKey => new
            {
                privateKey.Id,
                privateKey.Curve,
                privateKey.DerivationPath,
                privateKey.AddressFormat,
                privateKey.PublicKey,
                privateKey.GroupId,
            })
            .ToArrayAsync(ct);

        var apiKeys = await dbContext.WalletApiKeys
            .AsNoTracking()
            .Where(apiKey => apiKey.WalletPrivateKey!.WalletId == req.WalletId)
            .OrderBy(apiKey => apiKey.Name)
            .ThenBy(apiKey => apiKey.Id)
            .Select(apiKey => new
            {
                apiKey.WalletPrivateKeyId,
                Summary = new ApiKeySummary(apiKey.Id, apiKey.Name, apiKey.LastUsedAt),
            })
            .ToArrayAsync(ct);

        var apiKeysByPrivateKey = apiKeys.ToLookup(apiKey => apiKey.WalletPrivateKeyId, apiKey => apiKey.Summary);
        var privateKeySummaries = privateKeys
            .Select(privateKey => new PrivateKeySummary(
                privateKey.Id,
                privateKey.Curve,
                privateKey.DerivationPath,
                privateKey.PublicKey,
                privateKey.AddressFormat,
                WalletAddressFormatter.FormatAddress(privateKey.AddressFormat, privateKey.PublicKey),
                [.. apiKeysByPrivateKey[privateKey.Id]],
                privateKey.GroupId ?? Guid.Empty
            ))
            .ToArray();

        var privateKeyGroups = await dbContext.WalletPrivateKeyGroups
            .AsNoTracking()
            .Where(group => group.WalletId == req.WalletId)
            .OrderBy(group => group.Name)
            .ThenBy(group => group.Id)
            .Select(group => new PrivateKeyGroupSummary(group.Id, group.Name, group.Description))
            .ToArrayAsync(ct);

        await Send.OkAsync(new Response(wallet.Id, wallet.Name, wallet.Color, privateKeySummaries, privateKeyGroups), ct);
    }
}
