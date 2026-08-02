using Farsight.Rpc.Api.Auth;
using Farsight.Rpc.Api.Persistence;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;

namespace Farsight.Rpc.Api.Endpoints.Wallets.PrivateKeys.ApiKeys.Key;

public sealed class GET(AppDbContext dbContext) : Endpoint<GET.Request, GET.Response>
{
    public sealed record Request(
        [property: RouteParam] Guid WalletId,
        [property: RouteParam] Guid PrivateKeyId,
        [property: RouteParam] Guid ApiKeyId
    );

    public new sealed record Response(
        string Key
    );

    public override void Configure()
    {
        Get("/api/Wallets/{WalletId}/PrivateKeys/{PrivateKeyId}/ApiKeys/{ApiKeyId}/Key");
        Roles(AuthRoles.ADMIN);
    }

    public override async Task HandleAsync(Request req, CancellationToken ct)
    {
        var apiKey = await dbContext.WalletApiKeys
            .AsNoTracking()
            .Where(apiKey => apiKey.Id == req.ApiKeyId
                && apiKey.WalletPrivateKeyId == req.PrivateKeyId
                && apiKey.WalletPrivateKey!.WalletId == req.WalletId
            )
            .Select(apiKey => new Response(apiKey.Key))
            .SingleOrDefaultAsync(ct);

        if(apiKey is null)
        {
            ThrowError("API key not found.", StatusCodes.Status404NotFound);
        }

        await Send.OkAsync(apiKey, ct);
    }
}
