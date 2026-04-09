using Farsight.Rpc.Api.Persistence.Entities;
using Farsight.Rpc.Types;
using System.Text.Json.Serialization;

namespace Farsight.Rpc.Api.Persistence.Entities.Rpc;

[JsonPolymorphic(TypeDiscriminatorPropertyName = "type")]
[JsonDerivedType(typeof(RpcEndpoint.Realtime), "Realtime")]
[JsonDerivedType(typeof(RpcEndpoint.Archive), "Archive")]
[JsonDerivedType(typeof(RpcEndpoint.Tracing), "Tracing")]
public abstract class RpcEndpoint
{
    public required Guid Id { get; init; }
    public required HostEnvironment Environment { get; init; }
    public required string Chain { get; init; }

    public required Uri Address { get; init; }

    public required Guid ProviderId { get; init; }
    //Navigation Property
    [JsonIgnore]
    public RpcProvider? Provider { get; private set; } = null;

    public required Guid ApplicationId { get; init; }
    //Navigation Property
    [JsonIgnore]
    public ConsumerApplication? Application { get; private set; } = null;

    public sealed class Realtime : RpcEndpoint;

    public sealed class Archive : RpcEndpoint
    {
        public ulong IndexerStepSize { get; set; }
        public ulong DexIndexerStepSize { get; set; }
        public ulong IndexerBlockOffset { get; set; }
    }

    public sealed class Tracing : RpcEndpoint
    {
        public required TracingMode TracingMode { get; init; }
    }
}
