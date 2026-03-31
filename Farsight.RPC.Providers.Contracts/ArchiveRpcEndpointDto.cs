namespace Farsight.RPC.Providers.Contracts;

public sealed record ArchiveRpcEndpointDto(
    Guid Id,
    HostEnvironment Environment,
    string Application,
    string Chain,
    string Provider,
    Uri Address,
    int Priority,
    bool IsEnabled,
    ulong IndexerStepSize,
    ulong? DexIndexStepSize,
    ulong IndexBlockOffset,
    DateTimeOffset UpdatedUtc);
