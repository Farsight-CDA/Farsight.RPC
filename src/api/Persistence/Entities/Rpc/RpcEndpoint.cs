using Farsight.Rpc.Api.Persistence.Entities;
using Farsight.Rpc.Types;
using System.Text.Json.Serialization;

namespace Farsight.Rpc.Api.Persistence.Entities.Rpc;

public sealed class RpcEndpoint
{
    public required Guid Id { get; init; }
    public required Guid EnvironmentId { get; init; }
    public required string Chain { get; init; }

    public required Uri Address { get; init; }

    public required Guid ProviderId { get; set; }
    public required RpcCapability[] Capabilities { get; set; }
    public required ulong? EthGetLogsLimit { get; set; }
    public required int Order { get; set; }

    //Navigation Property
    [JsonIgnore]
    public RpcProvider? Provider { get; private set; } = null;

    public required Guid ApplicationId { get; init; }
    //Navigation Property
    [JsonIgnore]
    public ConsumerApplication? Application { get; private set; } = null;

    //Navigation Property
    [JsonIgnore]
    public ApplicationEnvironment? Environment { get; private set; } = null;
}
