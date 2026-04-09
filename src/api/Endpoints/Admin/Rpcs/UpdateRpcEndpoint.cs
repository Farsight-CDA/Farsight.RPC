using Farsight.Rpc.Api.Models;
using Farsight.Rpc.Api.Persistence;
using Farsight.Rpc.Types;
using FastEndpoints;

namespace Farsight.Rpc.Api.Endpoints.Admin.Rpcs;

public sealed class UpdateRpcEndpoint(RpcProvidersDbContext dbContext) : Endpoint<ProviderEditModel>
{
    public override void Configure()
    {
        Put("/api/admin/rpcs/{Type}/{Id}");
        Policies(AuthorizationPolicies.ADMIN_ONLY);
    }

    public override async Task HandleAsync(ProviderEditModel req, CancellationToken ct)
    {
        if(!req.Id.HasValue)
        {
            await Send.ResultAsync(TypedResults.BadRequest(new { Message = "RPC id is required for updates." }));
            return;
        }

        await RpcDbHelpers.SaveRpcAsync(dbContext, req, ct);
        await Send.NoContentAsync(ct);
    }
}
