using Farsight.Rpc.Api.Models;
using Farsight.Rpc.Api.Persistence;
using Farsight.Rpc.Api.Services;
using Farsight.Rpc.Types;
using FastEndpoints;

namespace Farsight.Rpc.Api.Endpoints.Admin.Endpoints;

public sealed class GetSavedEndpointEndpoint(RpcProvidersDbContext dbContext) : Endpoint<GetSavedEndpointEndpoint.Request, ProviderEditModel>
{
    public sealed class Request
    {
        public RpcEndpointType Type { get; set; }

        public Guid Id { get; set; }
    }

    public override void Configure()
    {
        Get("/api/admin/endpoints/{Type}/{Id}");
        Policies(AuthorizationPolicies.ADMIN_ONLY);
    }

    public override async Task HandleAsync(Request req, CancellationToken ct)
    {
        var model = await AdminEndpointDbHelpers.GetEditModelAsync(dbContext, req.Type, req.Id, ct);
        if(model is null)
        {
            await Send.NotFoundAsync(ct);
            return;
        }

        await Send.OkAsync(model, ct);
    }
}
