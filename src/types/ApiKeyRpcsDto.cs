using System.Collections.Immutable;
using System.Text.Json.Serialization;

namespace Farsight.Rpc.Types;

public sealed record ApiKeyRpcsDto
{
    public Dictionary<string, ImmutableArray<RpcEndpointDto>> Rpcs { get; init; }
    public Dictionary<string, ImmutableArray<Uri>> PublicRpcs { get; init; }
    public DateTimeOffset? PublicRpcsUpdatedAt { get; init; }
    public ImmutableArray<RpcProviderDto> Providers { get; init; }
    public ImmutableArray<RpcErrorGroupDto> ErrorGroups { get; init; }

    [JsonConstructor]
    public ApiKeyRpcsDto(
        Dictionary<string, ImmutableArray<RpcEndpointDto>> rpcs,
        Dictionary<string, ImmutableArray<Uri>> publicRpcs,
        DateTimeOffset? publicRpcsUpdatedAt,
        ImmutableArray<RpcProviderDto> providers,
        ImmutableArray<RpcErrorGroupDto> errorGroups)
    {
        Rpcs = rpcs;
        PublicRpcs = publicRpcs;
        PublicRpcsUpdatedAt = publicRpcsUpdatedAt;
        Providers = providers;
        ErrorGroups = errorGroups;
    }
}
