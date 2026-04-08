using Farsight.Rpc.Api.Models;
using Farsight.Rpc.Api.Services;
using FastEndpoints;

namespace Farsight.Rpc.Api.Endpoints.Admin.Providers;

public sealed class ProbeProviderEndpoint(RpcProbeService rpcProbeService) : Endpoint<ProbeRequest, ProbeResult>
{
    public override void Configure()
    {
        Post("/api/admin/providers/probe");
        Policies(AuthorizationPolicies.ADMIN_ONLY);
    }

    public override async Task HandleAsync(ProbeRequest req, CancellationToken ct)
        => await Send.OkAsync(await rpcProbeService.ProbeAsync(req, ct), ct);
}
