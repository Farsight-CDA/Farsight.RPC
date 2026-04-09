using Farsight.Rpc.Api.Persistence.Entities.Rpc;

namespace Farsight.Rpc.Api.Persistence.Entities;

public sealed record ConsumerApplication
{
    public required Guid Id { get; init; }
    public required string Name { get; set; }

    public List<ConsumerApiKey>? ApiKeys { get; private set; }

    public List<RpcEndpoint>? Rpcs { get; private set; }
}
