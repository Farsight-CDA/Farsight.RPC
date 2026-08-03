using Farsight.Rpc.Api.Auth;
using Farsight.Rpc.Api.Persistence;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace Farsight.Rpc.Api.Endpoints.Wallets.PrivateKeys;

public sealed class PUT(AppDbContext dbContext) : Endpoint<PUT.Request>
{
    public sealed record Request(
        [property: RouteParam] Guid WalletId,
        [property: RouteParam] Guid PrivateKeyId,
        Guid? GroupId
    );

    public override void Configure()
    {
        Put("/api/Wallets/{WalletId}/PrivateKeys/{PrivateKeyId}");
        Roles(AuthRoles.ADMIN);
    }

    public override async Task HandleAsync(Request req, CancellationToken ct)
    {
        var privateKey = await dbContext.WalletPrivateKeys
            .SingleOrDefaultAsync(privateKey => privateKey.WalletId == req.WalletId && privateKey.Id == req.PrivateKeyId, ct);

        if(privateKey is null)
        {
            ThrowError("Private key not found.", StatusCodes.Status404NotFound);
        }

        if(req.GroupId is not null)
        {
            var groupId = req.GroupId == Guid.Empty ? null : req.GroupId;

            if(groupId is not null
                && !await dbContext.WalletPrivateKeyGroups.AnyAsync(
                    group => group.WalletId == req.WalletId && group.Id == groupId,
                    ct))
            {
                ThrowError("Private key group not found.", StatusCodes.Status404NotFound);
            }

            privateKey.GroupId = groupId;
        }

        try
        {
            await dbContext.SaveChangesAsync(ct);
        }
        catch(DbUpdateException ex) when(ex.InnerException is PostgresException { SqlState: PostgresErrorCodes.ForeignKeyViolation })
        {
            ThrowError("Private key group not found.", StatusCodes.Status404NotFound);
        }
        await Send.NoContentAsync(ct);
    }
}
