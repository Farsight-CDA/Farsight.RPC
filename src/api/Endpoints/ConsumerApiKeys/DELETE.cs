using Farsight.Rpc.Api.Auth;
using Farsight.Rpc.Api.Persistence;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;

namespace Farsight.Rpc.Api.Endpoints.ConsumerApiKeys;

public sealed class DELETE(AppDbContext dbContext) : Endpoint<DELETE.Request>
{
    public sealed class Request
    {
        [RouteParam]
        public Guid ApplicationId { get; init; }

        [RouteParam]
        public Guid Id { get; init; }
    }

    public override void Configure()
    {
        Delete("/api/applications/{applicationId}/api-keys/{id}");
        Roles(AuthRoles.ADMIN);
    }

    public override async Task HandleAsync(Request req, CancellationToken ct)
    {
        int deletedRows = await dbContext.ConsumerApiKeys
            .Where(apiKey => apiKey.ApplicationId == req.ApplicationId && apiKey.Id == req.Id)
            .ExecuteDeleteAsync(ct);

        if(deletedRows == 0)
        {
            ThrowError("API key not found.", 404);
        }

        await Send.NoContentAsync(ct);
    }
}
