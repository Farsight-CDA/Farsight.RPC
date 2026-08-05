using Farsight.Rpc.Api.Persistence.Entities;
using Farsight.Rpc.Types;

namespace Farsight.Rpc.Api.Persistence.Entities.Rpc;

public sealed class RpcRule
{
    public required Guid Id { get; init; }
    public required Guid ApplicationId { get; init; }
    public required Guid EnvironmentId { get; init; }
    public required string[] Chains { get; set; }
    public required RpcCapability[] AllOf { get; set; }
    public required RpcCapability[] AnyOf { get; set; }

    //Navigation Property
    public ConsumerApplication? Application { get; private set; }

    //Navigation Property
    public ApplicationEnvironment? Environment { get; private set; }
}
