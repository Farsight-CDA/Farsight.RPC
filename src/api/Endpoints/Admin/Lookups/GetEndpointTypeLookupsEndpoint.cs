using FastEndpoints;

namespace Farsight.Rpc.Api.Endpoints.Admin.Lookups;

public sealed class GetEndpointTypeLookupsEndpoint : EndpointWithoutRequest<IReadOnlyList<string>>
{
    public override void Configure()
    {
        Get("/api/admin/lookups/endpoint-types");
        Policies(AuthorizationPolicies.ADMIN_ONLY);
    }

    public override Task HandleAsync(CancellationToken ct)
        => Send.OkAsync([.. Enum.GetNames<Farsight.Rpc.Types.RpcEndpointType>()], ct);
}
