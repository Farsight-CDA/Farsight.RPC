using Farsight.Rpc.Api.Persistence;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;

namespace Farsight.Rpc.Api.Endpoints.Admin.Providers;

public sealed class UpdateProviderEndpoint(RpcProvidersDbContext dbContext) : Endpoint<UpdateProviderEndpoint.Request>
{
    public sealed class Request
    {
        public Guid Id { get; set; }
        public int RateLimit { get; set; }
    }

    public override void Configure()
    {
        Patch("/api/admin/providers/{Id}");
        Policies(AuthorizationPolicies.ADMIN_ONLY);
    }

    public override async Task HandleAsync(Request req, CancellationToken ct)
    {
        var entity = await dbContext.Providers.SingleAsync(x => x.Id == req.Id, ct);
        entity.RateLimit = req.RateLimit;

        await dbContext.SaveChangesAsync(ct);
        await Send.NoContentAsync(ct);
    }
}
