using Farsight.Rpc.Api.Auth;
using Farsight.Rpc.Types;
using FastEndpoints;

namespace Farsight.Rpc.Api.Endpoints.RpcStructures;

public sealed class GET : EndpointWithoutRequest<GET.RpcStructureResponse[]>
{
    public sealed record RpcStructureResponse(
        RpcStructureType Structure,
        string DisplayName,
        Dictionary<RpcType, int> RequiredRpcTypes
    );

    public override void Configure()
    {
        Get("/api/RpcStructures");
        Roles(AuthRoles.ADMIN);
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var definitions = RpcStructureDefinition.All.Values
            .Select(d => new RpcStructureResponse(d.Structure, d.DisplayName, d.RequiredRpcTypes))
            .ToArray();

        await Send.OkAsync(definitions, ct);
    }
}
