using System.Text.Json.Serialization;

namespace Farsight.Rpc.Types;

[JsonPolymorphic(TypeDiscriminatorPropertyName = "type")]
[JsonDerivedType(typeof(RpcEndpointDto.Realtime), "Realtime")]
[JsonDerivedType(typeof(RpcEndpointDto.Archive), "Archive")]
[JsonDerivedType(typeof(RpcEndpointDto.Tracing), "Tracing")]
public abstract record RpcEndpointDto
{
    public required Guid Id { get; init; }
    public required Uri Address { get; init; }
    public required Guid ProviderId { get; init; }

    public sealed record Realtime : RpcEndpointDto;

    public sealed record Archive : RpcEndpointDto
    {
        public ulong IndexerStepSize { get; init; }
        public ulong DexIndexerStepSize { get; init; }
        public ulong IndexerBlockOffset { get; init; }
    }

    public sealed record Tracing : RpcEndpointDto
    {
        public required TracingMode TracingMode { get; init; }
    }
}
