using Farsight.Rpc.Api.Auth;
using Farsight.Rpc.Api.Persistence;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;

namespace Farsight.Rpc.Api.Endpoints.Applications.Rules;

public sealed class DELETE(AppDbContext dbContext) : Endpoint<DELETE.Request>
{
    public sealed record Request(
        [property: RouteParam] Guid ApplicationId,
        [property: RouteParam] Guid EnvironmentId,
        [property: RouteParam] Guid RuleId
    );

    public override void Configure()
    {
        Delete("/api/Applications/{ApplicationId}/Environments/{EnvironmentId}/Rules/{RuleId}");
        Roles(AuthRoles.ADMIN);
    }

    public override async Task HandleAsync(Request req, CancellationToken ct)
    {
        int deletedRows = await dbContext.RpcRules
            .Where(rule =>
                rule.ApplicationId == req.ApplicationId &&
                rule.EnvironmentId == req.EnvironmentId &&
                rule.Id == req.RuleId)
            .ExecuteDeleteAsync(ct);

        if(deletedRows == 0)
        {
            ThrowError("Rule not found.", 404);
        }

        await Send.NoContentAsync(ct);
    }
}
