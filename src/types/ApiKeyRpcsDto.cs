using System.Collections.Immutable;
using System.Text.Json.Serialization;

namespace Farsight.Rpc.Types;

public sealed record ApiKeyRpcsDto
{
    public Dictionary<string, ImmutableArray<RpcEndpointDto>> Rpcs { get; init; }
    public ImmutableArray<RpcProviderDto> Providers { get; init; }
    public ImmutableArray<RpcErrorGroupDto> ErrorGroups { get; init; }

    [JsonConstructor]
    public ApiKeyRpcsDto(Dictionary<string, ImmutableArray<RpcEndpointDto>> rpcs, ImmutableArray<RpcProviderDto> providers, ImmutableArray<RpcErrorGroupDto> errorGroups)
    {
        Rpcs = rpcs;
        Providers = providers;
        ErrorGroups = errorGroups;
    }
}
