using Farsight.Rpc.Api.Models;
using Farsight.Rpc.Api.Persistence;
using Farsight.Rpc.Types;
using FastEndpoints;

namespace Farsight.Rpc.Api.Endpoints.Admin.Rpcs;

public sealed class GetRpcEndpoint(RpcProvidersDbContext dbContext) : Endpoint<GetRpcEndpoint.Request, ProviderEditModel>
{
    public sealed class Request
    {
        public RpcEndpointType Type { get; set; }
        public Guid Id { get; set; }
    }

    public override void Configure()
    {
        Get("/api/admin/rpcs/{Type}/{Id}");
        Policies(AuthorizationPolicies.ADMIN_ONLY);
    }

    public override async Task HandleAsync(Request req, CancellationToken ct)
    {
        var model = await RpcDbHelpers.GetEditModelAsync(dbContext, req.Type, req.Id, ct);
        if(model is null)
        {
            await Send.NotFoundAsync(ct);
            return;
        }

        await Send.OkAsync(model, ct);
    }
}
