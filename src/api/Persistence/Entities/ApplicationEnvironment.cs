using Farsight.Rpc.Api.Persistence.Entities.Rpc;

namespace Farsight.Rpc.Api.Persistence.Entities;

public sealed record ApplicationEnvironment
{
    public required Guid Id { get; init; }
    public required Guid ApplicationId { get; init; }
    public required string Name { get; set; }

    //Navigation Property
    public ConsumerApplication? Application { get; private set; }

    //Navigation Property
    public List<ConsumerApiKey>? ApiKeys { get; private set; }

    //Navigation Property
    public List<RpcEndpoint>? Rpcs { get; private set; }
}
