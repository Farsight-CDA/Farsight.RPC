namespace Farsight.RPC.Types;

public sealed record ArchiveRpcEndpointDto(
    Guid Id,
    HostEnvironment Environment,
    string Application,
    string Chain,
    string Provider,
    Uri Address,
    ulong IndexerStepSize,
    ulong? DexIndexStepSize,
    ulong IndexBlockOffset,
    DateTimeOffset UpdatedUtc,
    DateTimeOffset? ProbedUtc);
