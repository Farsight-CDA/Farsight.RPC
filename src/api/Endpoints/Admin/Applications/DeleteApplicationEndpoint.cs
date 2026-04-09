using Farsight.Rpc.Api.Persistence;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;

namespace Farsight.Rpc.Api.Endpoints.Admin.Applications;

public sealed class DeleteApplicationEndpoint(RpcProvidersDbContext dbContext) : Endpoint<DeleteApplicationEndpoint.Request>
{
    public sealed class Request
    {
        public Guid Id { get; set; }
    }

    public override void Configure()
    {
        Delete("/api/admin/applications/{Id}");
        Policies(AuthorizationPolicies.ADMIN_ONLY);
    }

    public override async Task HandleAsync(Request req, CancellationToken ct)
    {
        var app = await dbContext.Applications.SingleAsync(x => x.Id == req.Id, ct);
        dbContext.Applications.Remove(app);
        await dbContext.SaveChangesAsync(ct);
        await Send.NoContentAsync(ct);
    }
}
