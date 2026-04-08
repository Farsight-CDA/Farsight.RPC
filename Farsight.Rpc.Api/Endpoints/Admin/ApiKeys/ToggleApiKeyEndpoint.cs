using Farsight.Rpc.Api.Persistence;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;

namespace Farsight.Rpc.Api.Endpoints.Admin.ApiKeys;

public sealed class ToggleApiKeyEndpoint(RpcProvidersDbContext dbContext) : Endpoint<ToggleApiKeyEndpoint.Request>
{
    public sealed class Request
    {
        public Guid Id { get; set; }
    }

    public override void Configure()
    {
        Post("/api/admin/api-keys/{Id}/toggle");
        Policies(AuthorizationPolicies.ADMIN_ONLY);
    }

    public override async Task HandleAsync(Request req, CancellationToken ct)
    {
        var client = await dbContext.ApiClients.SingleAsync(x => x.Id == req.Id, ct);
        client.IsEnabled = !client.IsEnabled;
        client.UpdatedUtc = DateTimeOffset.UtcNow;
        await dbContext.SaveChangesAsync(ct);
        await Send.NoContentAsync(ct);
    }
}
