using Farsight.Rpc.Types;
using Farsight.Rpc.Api.Persistence;
using Farsight.Rpc.Api.Services;
using FastEndpoints;

namespace Farsight.Rpc.Api.Endpoints.Admin.Endpoints;

public sealed class DeleteSavedEndpointEndpoint(RpcProvidersDbContext dbContext) : Endpoint<DeleteSavedEndpointEndpoint.Request>
{
    public sealed class Request
    {
        public RpcEndpointType Type { get; set; }
        public Guid Id { get; set; }
    }

    public override void Configure()
    {
        Delete("/api/admin/endpoints/{Type}/{Id}");
        Policies(AuthorizationPolicies.ADMIN_ONLY);
    }

    public override async Task HandleAsync(Request req, CancellationToken ct)
    {
        await AdminEndpointDbHelpers.DeleteEndpointAsync(dbContext, req.Type, req.Id, ct);
        await Send.NoContentAsync(ct);
    }
}
