using Farsight.Rpc.Api.Auth;
using Farsight.Rpc.Api.Persistence;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;

namespace Farsight.Rpc.Api.Endpoints.Wallets.PrivateKeyGroups;

public sealed class DELETE(AppDbContext dbContext) : Endpoint<DELETE.Request>
{
    public sealed record Request(
        [property: RouteParam] Guid WalletId,
        [property: RouteParam] Guid PrivateKeyGroupId
    );

    public override void Configure()
    {
        Delete("/api/Wallets/{WalletId}/PrivateKeyGroups/{PrivateKeyGroupId}");
        Roles(AuthRoles.ADMIN);
    }

    public override async Task HandleAsync(Request req, CancellationToken ct)
    {
        int deletedRows = await dbContext.WalletPrivateKeyGroups
            .Where(group => group.WalletId == req.WalletId && group.Id == req.PrivateKeyGroupId)
            .ExecuteDeleteAsync(ct);

        if(deletedRows == 0)
        {
            ThrowError("Private key group not found.", StatusCodes.Status404NotFound);
        }

        await Send.NoContentAsync(ct);
    }
}
