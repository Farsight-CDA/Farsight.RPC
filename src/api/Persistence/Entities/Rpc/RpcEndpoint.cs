using Farsight.Rpc.Api.Persistence.Entities;
using Farsight.Rpc.Types;
using System.Text.Json.Serialization;

namespace Farsight.Rpc.Api.Persistence.Entities.Rpc;

[JsonPolymorphic(TypeDiscriminatorPropertyName = "type")]
[JsonDerivedType(typeof(RealtimeRpc), "Realtime")]
[JsonDerivedType(typeof(ArchiveRpc), "Archive")]
[JsonDerivedType(typeof(TracingRpc), "Tracing")]
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
}
