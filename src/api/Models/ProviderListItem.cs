using Farsight.Rpc.Types;

namespace Farsight.Rpc.Api.Models;

public sealed record ProviderListItem(
    Guid Id,
    RpcEndpointType Type,
    HostEnvironment Environment,
    string Application,
    string Chain,
    string Provider,
    Uri Address,
    ulong? IndexerStepSize,
    ulong? DexIndexStepSize,
    ulong? IndexBlockOffset,
    TracingMode? TracingMode,
    DateTimeOffset UpdatedUtc
);
