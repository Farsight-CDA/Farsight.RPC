using Farsight.Rpc.Api.Models;
using Farsight.Rpc.Api.Persistence;
using FastEndpoints;

namespace Farsight.Rpc.Api.Endpoints.Admin.Rpcs;

public sealed class CreateRpcEndpoint(RpcProvidersDbContext dbContext) : Endpoint<ProviderEditModel>
{
    public override void Configure()
    {
        Post("/api/admin/rpcs");
        Policies(AuthorizationPolicies.ADMIN_ONLY);
    }

    public override async Task HandleAsync(ProviderEditModel req, CancellationToken ct)
    {
        req.Id = null;
        await RpcDbHelpers.SaveRpcAsync(dbContext, req, ct);
        await Send.NoContentAsync(ct);
    }
}
