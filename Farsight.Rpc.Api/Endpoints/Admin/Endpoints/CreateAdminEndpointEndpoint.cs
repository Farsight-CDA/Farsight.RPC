using Farsight.Rpc.Api.Models;
using Farsight.Rpc.Api.Persistence;
using Farsight.Rpc.Api.Services;
using FastEndpoints;

namespace Farsight.Rpc.Api.Endpoints.Admin.Endpoints;

public sealed class CreateAdminEndpointEndpoint(RpcProvidersDbContext dbContext) : Endpoint<ProviderEditModel>
{
    public override void Configure()
    {
        Post("/api/admin/endpoints");
        Policies(AuthorizationPolicies.ADMIN_ONLY);
    }

    public override async Task HandleAsync(ProviderEditModel req, CancellationToken ct)
    {
        req.Id = null;
        await AdminEndpointDbHelpers.SaveEndpointAsync(dbContext, req, ct);
        await Send.NoContentAsync(ct);
    }
}
