using Farsight.Rpc.Api.Persistence;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;

namespace Farsight.Rpc.Api.Endpoints.Admin.Providers;

public sealed class DeleteProviderEndpoint(RpcProvidersDbContext dbContext) : Endpoint<DeleteProviderEndpoint.Request>
{
    public sealed class Request
    {
        public Guid Id { get; set; }
    }

    public override void Configure()
    {
        Delete("/api/admin/providers/{Id}");
        Policies(AuthorizationPolicies.ADMIN_ONLY);
    }

    public override async Task HandleAsync(Request req, CancellationToken ct)
    {
        var provider = await dbContext.Providers.SingleAsync(x => x.Id == req.Id, ct);
        dbContext.Providers.Remove(provider);
        await dbContext.SaveChangesAsync(ct);
        await Send.NoContentAsync(ct);
    }
}
