using Farsight.Rpc.Api.Auth;
using Farsight.Rpc.Api.Persistence;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;

namespace Farsight.Rpc.Api.Endpoints.Applications.Environments.PublicRpcs;

public sealed class PUT(AppDbContext dbContext) : Endpoint<PUT.Request>
{
    public sealed record Request(
        [property: RouteParam] Guid ApplicationId,
        [property: RouteParam] Guid EnvironmentId,
        bool EnablePublicRpcs
    );

    public override void Configure()
    {
        Put("/api/Applications/{ApplicationId}/Environments/{EnvironmentId}/PublicRpcs");
        Roles(AuthRoles.ADMIN);
    }

    public override async Task HandleAsync(Request req, CancellationToken ct)
    {
        var environment = await dbContext.ApplicationEnvironments
            .SingleOrDefaultAsync(environment => environment.ApplicationId == req.ApplicationId && environment.Id == req.EnvironmentId, ct);

        if(environment is null)
        {
            ThrowError("Environment not found.", 404);
        }

        environment.EnablePublicRpcs = req.EnablePublicRpcs;

        await dbContext.SaveChangesAsync(ct);

        await Send.NoContentAsync(ct);
    }
}
