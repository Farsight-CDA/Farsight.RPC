using Farsight.Rpc.Api.Auth;
using Farsight.Rpc.Api.Persistence;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;

namespace Farsight.Rpc.Api.Endpoints.Wallets.PrivateKeys;

public sealed class DELETE(AppDbContext dbContext) : Endpoint<DELETE.Request>
{
    public sealed record Request(
        [property: RouteParam] Guid WalletId,
        [property: RouteParam] Guid PrivateKeyId
    );

    public override void Configure()
    {
        Delete("/api/Wallets/{WalletId}/PrivateKeys/{PrivateKeyId}");
        Roles(AuthRoles.ADMIN);
    }

    public override async Task HandleAsync(Request req, CancellationToken ct)
    {
        int deletedRows = await dbContext.WalletPrivateKeys
            .Where(privateKey => privateKey.WalletId == req.WalletId && privateKey.Id == req.PrivateKeyId)
            .ExecuteDeleteAsync(ct);

        if(deletedRows == 0)
        {
            ThrowError("Private key not found.", StatusCodes.Status404NotFound);
        }

        await Send.NoContentAsync(ct);
    }
}
