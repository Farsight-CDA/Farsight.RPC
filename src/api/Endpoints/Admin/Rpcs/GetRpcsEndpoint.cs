using Farsight.Rpc.Api.Models;
using Farsight.Rpc.Api.Persistence;
using Farsight.Rpc.Types;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;

namespace Farsight.Rpc.Api.Endpoints.Admin.Rpcs;

public sealed class GetRpcsEndpoint(RpcProvidersDbContext dbContext) : Endpoint<GetRpcsEndpoint.Request, IReadOnlyList<ProviderListItem>>
{
    public sealed class Request
    {
        public Guid? ApplicationId { get; set; }
        public HostEnvironment Environment { get; set; } = HostEnvironment.Development;
        public string? Chain { get; set; }
    }

    public override void Configure()
    {
        Get("/api/admin/rpcs");
        Policies(AuthorizationPolicies.ADMIN_ONLY);
    }

    public override async Task HandleAsync(Request req, CancellationToken ct)
    {
        if(!req.ApplicationId.HasValue || String.IsNullOrWhiteSpace(req.Chain))
        {
            await Send.OkAsync([], ct);
            return;
        }

        var appId = req.ApplicationId.Value;
        var chain = req.Chain;

        var rows = new List<ProviderListItem>();
        rows.AddRange(await dbContext.RealTimeEndpoints.AsNoTracking().Include(x => x.Application).Include(x => x.Provider)
            .Where(x => x.ApplicationId == appId && x.Chain == chain && x.Environment == req.Environment)
            .Select(x => new ProviderListItem(x.Id, RpcEndpointType.RealTime, x.Environment, x.Application.Name, x.Chain, x.Provider.Name, x.Address, null, null, null, null, x.UpdatedUtc)).ToListAsync(ct));
        rows.AddRange(await dbContext.ArchiveEndpoints.AsNoTracking().Include(x => x.Application).Include(x => x.Provider)
            .Where(x => x.ApplicationId == appId && x.Chain == chain && x.Environment == req.Environment)
            .Select(x => new ProviderListItem(x.Id, RpcEndpointType.Archive, x.Environment, x.Application.Name, x.Chain, x.Provider.Name, x.Address, x.IndexerStepSize, x.DexIndexStepSize, x.IndexBlockOffset, null, x.UpdatedUtc)).ToListAsync(ct));
        rows.AddRange(await dbContext.TracingEndpoints.AsNoTracking().Include(x => x.Application).Include(x => x.Provider)
            .Where(x => x.ApplicationId == appId && x.Chain == chain && x.Environment == req.Environment)
            .Select(x => new ProviderListItem(x.Id, RpcEndpointType.Tracing, x.Environment, x.Application.Name, x.Chain, x.Provider.Name, x.Address, null, null, null, x.TracingMode, x.UpdatedUtc)).ToListAsync(ct));

        await Send.OkAsync([.. rows.OrderBy(x => x.Type).ThenBy(x => x.Provider).ThenByDescending(x => x.UpdatedUtc)], ct);
    }
}
