using Farsight.Rpc.Api.Auth;
using Farsight.Rpc.Api.Persistence;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;

namespace Farsight.Rpc.Api.Endpoints.Applications;

public sealed class DELETE(AppDbContext dbContext) : Endpoint<DELETE.Request>
{
    public sealed record Request(
        [property: RouteParam] Guid Id
    );

    public override void Configure()
    {
        Delete("/api/applications/{id}");
        Roles(AuthRoles.ADMIN);
    }

    public override async Task HandleAsync(Request req, CancellationToken ct)
    {
        int deletedRows = await dbContext.ConsumerApplications
            .Where(a => a.Id == req.Id)
            .ExecuteDeleteAsync(ct);

        if(deletedRows == 0)
        {
            ThrowError("Application not found.", 404);
        }

        await Send.NoContentAsync(ct);
    }
}
