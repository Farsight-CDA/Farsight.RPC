using Farsight.Rpc.Api.Models;
using Farsight.Rpc.Api.Persistence;
using Farsight.Rpc.Api.Services;
using FastEndpoints;

namespace Farsight.Rpc.Api.Endpoints.Admin.Endpoints;

public sealed class UpdateSavedEndpointEndpoint(RpcProvidersDbContext dbContext) : Endpoint<ProviderEditModel>
{
    public override void Configure()
    {
        Put("/api/admin/endpoints");
        Policies(AuthorizationPolicies.ADMIN_ONLY);
    }

    public override async Task HandleAsync(ProviderEditModel req, CancellationToken ct)
    {
        if(!req.Id.HasValue)
        {
            await Send.ResultAsync(TypedResults.BadRequest(new { Message = "Endpoint id is required for updates." }));
            return;
        }

        await AdminEndpointDbHelpers.SaveEndpointAsync(dbContext, req, ct);
        await Send.NoContentAsync(ct);
    }
}
