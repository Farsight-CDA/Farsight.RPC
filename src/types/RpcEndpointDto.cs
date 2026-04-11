using System.Text.Json.Serialization;

namespace Farsight.Rpc.Types;

[JsonPolymorphic(TypeDiscriminatorPropertyName = "type")]
[JsonDerivedType(typeof(Realtime), nameof(RpcType.Realtime))]
[JsonDerivedType(typeof(Archive), nameof(RpcType.Archive))]
[JsonDerivedType(typeof(Tracing), nameof(RpcType.Tracing))]
public abstract record RpcEndpointDto
{
    public required Guid Id { get; init; }
    public required Uri Address { get; init; }
    public required Guid ProviderId { get; init; }

    public sealed record Realtime : RpcEndpointDto;

    public sealed record Archive : RpcEndpointDto
    {
        public ulong IndexerStepSize { get; init; }
        public ulong IndexerBlockOffset { get; init; }
    }

    public sealed record Tracing : RpcEndpointDto
    {
        public required TracingMode TracingMode { get; init; }
    }
}
