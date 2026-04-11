using Farsight.Rpc.Api.Auth;
using Farsight.Rpc.Api.Persistence;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;

namespace Farsight.Rpc.Api.Endpoints.RpcProviders;

public sealed class DELETE(AppDbContext dbContext) : Endpoint<DELETE.Request>
{
    public sealed record Request(
        [property: RouteParam] Guid RpcProviderId
    );

    public override void Configure()
    {
        Delete("/api/RpcProviders/{RpcProviderId}");
        Roles(AuthRoles.ADMIN);
    }

    public override async Task HandleAsync(Request req, CancellationToken ct)
    {
        int deletedRows = await dbContext.RpcProviders
            .Where(provider => provider.Id == req.RpcProviderId)
            .ExecuteDeleteAsync(ct);

        if(deletedRows == 0)
        {
            ThrowError("RPC provider not found.", 404);
        }

        await Send.NoContentAsync(ct);
    }
}
