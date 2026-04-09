using FastEndpoints;

namespace Farsight.Rpc.Api.Endpoints.Admin.Lookups;

public sealed class GetEnvironmentLookupsEndpoint : EndpointWithoutRequest<IReadOnlyList<string>>
{
    public override void Configure()
    {
        Get("/api/admin/lookups/environments");
        Policies(AuthorizationPolicies.ADMIN_ONLY);
    }

    public override Task HandleAsync(CancellationToken ct)
        => Send.OkAsync([.. Enum.GetNames<Farsight.Rpc.Types.HostEnvironment>()], ct);
}
