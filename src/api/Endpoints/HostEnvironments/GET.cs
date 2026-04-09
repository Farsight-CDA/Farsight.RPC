using Farsight.Rpc.Api.Auth;
using Farsight.Rpc.Types;
using FastEndpoints;

namespace Farsight.Rpc.Api.Endpoints.HostEnvironments;

public sealed class GET : EndpointWithoutRequest<HostEnvironment[]>
{
    public override void Configure()
    {
        Get("/api/host-environments");
        Roles(AuthRoles.ADMIN);
    }

    public override async Task HandleAsync(CancellationToken ct)
        => await Send.OkAsync(Enum.GetValues<HostEnvironment>(), ct);
}
