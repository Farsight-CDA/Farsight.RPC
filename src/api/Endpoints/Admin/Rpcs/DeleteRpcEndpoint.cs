using Farsight.Rpc.Types;
using Farsight.Rpc.Api.Persistence;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;

namespace Farsight.Rpc.Api.Endpoints.Admin.Rpcs;

public sealed class DeleteRpcEndpoint(RpcProvidersDbContext dbContext) : Endpoint<DeleteRpcEndpoint.Request>
{
    public sealed class Request
    {
        public RpcEndpointType Type { get; set; }
        public Guid Id { get; set; }
    }

    public override void Configure()
    {
        Delete("/api/admin/rpcs/{Type}/{Id}");
        Policies(AuthorizationPolicies.ADMIN_ONLY);
    }

    public override async Task HandleAsync(Request req, CancellationToken ct)
    {
        switch(req.Type)
        {
            case RpcEndpointType.RealTime:
                dbContext.RealTimeEndpoints.Remove(await dbContext.RealTimeEndpoints.SingleAsync(x => x.Id == req.Id, ct));
                break;
            case RpcEndpointType.Archive:
                dbContext.ArchiveEndpoints.Remove(await dbContext.ArchiveEndpoints.SingleAsync(x => x.Id == req.Id, ct));
                break;
            case RpcEndpointType.Tracing:
                dbContext.TracingEndpoints.Remove(await dbContext.TracingEndpoints.SingleAsync(x => x.Id == req.Id, ct));
                break;
            default:
                throw new ArgumentOutOfRangeException(nameof(req.Type), req.Type, null);
        }

        await dbContext.SaveChangesAsync(ct);
        await Send.NoContentAsync(ct);
    }
}
