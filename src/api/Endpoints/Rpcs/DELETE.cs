using Farsight.Rpc.Api.Auth;
using Farsight.Rpc.Api.Persistence;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;

namespace Farsight.Rpc.Api.Endpoints.Rpcs;

public sealed class DELETE(AppDbContext dbContext) : Endpoint<DELETE.Request>
{
    public sealed record Request(
        [property: RouteParam] Guid ApplicationId,
        [property: RouteParam] Guid Id
    );

    public override void Configure()
    {
        Delete("/api/applications/{applicationId}/rpcs/{id}");
        Roles(AuthRoles.ADMIN);
    }

    public override async Task HandleAsync(Request req, CancellationToken ct)
    {
        int deletedRows = await dbContext.Rpcs
            .Where(rpc => rpc.ApplicationId == req.ApplicationId && rpc.Id == req.Id)
            .ExecuteDeleteAsync(ct);

        if(deletedRows == 0)
        {
            ThrowError("RPC not found.", 404);
        }

        await Send.NoContentAsync(ct);
    }
}
