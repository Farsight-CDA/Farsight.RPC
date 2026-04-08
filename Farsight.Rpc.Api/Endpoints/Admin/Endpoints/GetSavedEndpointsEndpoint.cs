using Farsight.Rpc.Api.Models;
using Farsight.Rpc.Api.Persistence;
using Farsight.Rpc.Api.Services;
using Farsight.Rpc.Types;
using FastEndpoints;

namespace Farsight.Rpc.Api.Endpoints.Admin.Endpoints;

public sealed class GetSavedEndpointsEndpoint(RpcProvidersDbContext dbContext) : Endpoint<GetSavedEndpointsEndpoint.Request, IReadOnlyList<ProviderListItem>>
{
    public sealed class Request
    {
        public Guid? ApplicationId { get; set; }
        public HostEnvironment Environment { get; set; } = HostEnvironment.Development;
        public Guid? ChainId { get; set; }
    }

    public override void Configure()
    {
        Get("/api/admin/endpoints");
        Policies(AuthorizationPolicies.ADMIN_ONLY);
    }

    public override async Task HandleAsync(Request req, CancellationToken ct)
        => await Send.OkAsync(await AdminEndpointDbHelpers.GetListAsync(dbContext, new ProviderSelectionModel
        {
            ApplicationId = req.ApplicationId,
            Environment = req.Environment,
            ChainId = req.ChainId
        }, ct), ct);
}
