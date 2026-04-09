using Farsight.Rpc.Api.Persistence.Entities.Rpc;

namespace Farsight.Rpc.Api.Persistence.Entities;

public sealed record RpcProvider
{
    public required Guid Id { get; init; }
    public required string Name { get; init; }
    public required int RateLimit { get; set; }

    public List<RpcEndpoint>? Rpcs { get; private set; }
}
