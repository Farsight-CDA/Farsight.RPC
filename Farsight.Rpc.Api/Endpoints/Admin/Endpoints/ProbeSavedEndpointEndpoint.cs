using Farsight.Rpc.Api.Models;
using Farsight.Rpc.Api.Persistence;
using Farsight.Rpc.Api.Services;
using Farsight.Rpc.Types;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;

namespace Farsight.Rpc.Api.Endpoints.Admin.Endpoints;

public sealed class ProbeSavedEndpointEndpoint(RpcProvidersDbContext dbContext, RpcProbeService rpcProbeService) : Endpoint<ProbeSavedEndpointEndpoint.Request, ProbeResult>
{
    public sealed class Request
    {
        public RpcEndpointType Type { get; set; }
        public Guid Id { get; set; }
    }

    public override void Configure()
    {
        Post("/api/admin/endpoints/{Type}/{Id}/probe");
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

        var result = await rpcProbeService.ProbeAsync(new ProbeRequest { Type = req.Type, Address = model.Address }, ct);

        DateTimeOffset? probedUtc = result.Succeeded ? DateTimeOffset.UtcNow : null;
        switch(req.Type)
        {
            case RpcEndpointType.RealTime:
                (await dbContext.RealTimeEndpoints.SingleAsync(x => x.Id == req.Id, ct)).ProbedUtc = probedUtc;
                break;
            case RpcEndpointType.Archive:
                (await dbContext.ArchiveEndpoints.SingleAsync(x => x.Id == req.Id, ct)).ProbedUtc = probedUtc;
                break;
            case RpcEndpointType.Tracing:
                (await dbContext.TracingEndpoints.SingleAsync(x => x.Id == req.Id, ct)).ProbedUtc = probedUtc;
                break;
            default:
                throw new ArgumentOutOfRangeException(nameof(req.Type), req.Type, null);
        }

        await dbContext.SaveChangesAsync(ct);
        await Send.OkAsync(result, ct);
    }
}
