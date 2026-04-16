using System.Text.Json.Serialization;

namespace Farsight.Rpc.Types;

public sealed record ApiKeyRpcsDto
{
    public Dictionary<string, RpcEndpointDto[]> Rpcs { get; init; }
    public RpcProviderDto[] Providers { get; init; }

    [JsonConstructor]
    public ApiKeyRpcsDto(Dictionary<string, RpcEndpointDto[]> rpcs, RpcProviderDto[] providers)
    {
        Rpcs = rpcs;
        Providers = providers;
    }
}
