using Farsight.Rpc.Api.Auth;
using Farsight.Rpc.Api.Persistence;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;

namespace Farsight.Rpc.Api.Endpoints.RpcErrorGroups;

public sealed class DELETE(AppDbContext dbContext) : Endpoint<DELETE.Request>
{
    public sealed record Request(
        [property: RouteParam] Guid RpcErrorGroupId
    );

    public override void Configure()
    {
        Delete("/api/RpcErrorGroups/{RpcErrorGroupId}");
        Roles(AuthRoles.ADMIN);
    }

    public override async Task HandleAsync(Request req, CancellationToken ct)
    {
        int deletedRows = await dbContext.RpcErrorGroups
            .Where(group => group.Id == req.RpcErrorGroupId)
            .ExecuteDeleteAsync(ct);

        if(deletedRows == 0)
        {
            ThrowError("RPC error group not found.", 404);
        }

        await Send.NoContentAsync(ct);
    }
}
