using Farsight.Rpc.Api.Persistence.Entities.Rpc;

namespace Farsight.Rpc.Api.Persistence.Entities;

public sealed record RpcProvider
{
    public required Guid Id { get; init; }
    public required string Name { get; init; }
    public required int RateLimit { get; set; }

    public List<RealtimeRpc>? RealtimeRpcs { get; private set; }
    public List<ArchiveRpc>? ArchiveRpcs { get; private set; }
    public List<TracingRpc>? TracingRpcs { get; private set; }
}
