using Farsight.Rpc.Types;

namespace Farsight.Rpc.Api.Persistence.Entities.Rpc;

public sealed record ArchiveRpc
{
    public required Guid Id { get; init; }
    public required HostEnvironment Environment { get; init; }
    public required string Chain { get; init; }

    public required Uri Address { get; init; }

    public required Guid ProviderId { get; init; }
    //Navigation Property
    public RpcProvider? Provider { get; private set; } = null;

    public required Guid ApplicationId { get; init; }
    //Navigation Property
    public ConsumerApplication? Application { get; private set; } = null;

    public ulong IndexerStepSize { get; set; }
    public ulong DexIndexerStepSize { get; set; }
    public ulong IndexerBlockOffset { get; set; }
}
