using Farsight.Rpc.Api.Auth;
using Farsight.Rpc.Api.Persistence;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;

namespace Farsight.Rpc.Api.Endpoints.Applications.Environments;

public sealed class DELETE(AppDbContext dbContext) : Endpoint<DELETE.Request>
{
    public sealed record Request(
        [property: RouteParam] Guid ApplicationId,
        [property: RouteParam] Guid EnvironmentId
    );

    public override void Configure()
    {
        Delete("/api/Applications/{ApplicationId}/Environments/{EnvironmentId}");
        Roles(AuthRoles.ADMIN);
    }

    public override async Task HandleAsync(Request req, CancellationToken ct)
    {
        int deletedRows = await dbContext.ApplicationEnvironments
            .Where(environment => environment.ApplicationId == req.ApplicationId && environment.Id == req.EnvironmentId)
            .ExecuteDeleteAsync(ct);

        if(deletedRows == 0)
        {
            ThrowError("Environment not found.", 404);
        }

        await Send.NoContentAsync(ct);
    }
}
