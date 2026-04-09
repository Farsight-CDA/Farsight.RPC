using Farsight.Rpc.Api.Persistence;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;

namespace Farsight.Rpc.Api.Endpoints.Admin.Chains;

public sealed class DeleteChainEndpoint(RpcProvidersDbContext dbContext) : Endpoint<DeleteChainEndpoint.Request>
{
    public sealed class Request
    {
        public Guid Id { get; set; }
    }

    public override void Configure()
    {
        Delete("/api/admin/chains/{Id}");
        Policies(AuthorizationPolicies.ADMIN_ONLY);
    }

    public override async Task HandleAsync(Request req, CancellationToken ct)
    {
        var chain = await dbContext.Chains.SingleAsync(x => x.Id == req.Id, ct);
        dbContext.Chains.Remove(chain);
        await dbContext.SaveChangesAsync(ct);
        await Send.NoContentAsync(ct);
    }
}
