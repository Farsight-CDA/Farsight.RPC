using Farsight.Rpc.Api.Auth;
using Farsight.Rpc.Api.Persistence;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;

namespace Farsight.Rpc.Api.Endpoints.Wallets.PrivateKeys.ApiKeys;

public sealed class DELETE(AppDbContext dbContext) : Endpoint<DELETE.Request>
{
    public sealed record Request(
        [property: RouteParam] Guid WalletId,
        [property: RouteParam] Guid PrivateKeyId,
        [property: RouteParam] Guid ApiKeyId
    );

    public override void Configure()
    {
        Delete("/api/Wallets/{WalletId}/PrivateKeys/{PrivateKeyId}/ApiKeys/{ApiKeyId}");
        Roles(AuthRoles.ADMIN);
    }

    public override async Task HandleAsync(Request req, CancellationToken ct)
    {
        int deletedRows = await dbContext.WalletApiKeys
            .Where(apiKey => apiKey.Id == req.ApiKeyId
                && apiKey.WalletPrivateKeyId == req.PrivateKeyId
                && apiKey.WalletPrivateKey!.WalletId == req.WalletId
            )
            .ExecuteDeleteAsync(ct);

        if(deletedRows == 0)
        {
            ThrowError("API key not found.", StatusCodes.Status404NotFound);
        }

        await Send.NoContentAsync(ct);
    }
}
