namespace Farsight.RPC.Providers.Contracts;

public sealed record RealTimeRpcEndpointDto(
    Guid Id,
    HostEnvironment Environment,
    string Application,
    string Chain,
    string Provider,
    Uri Address,
    int Priority,
    bool IsEnabled,
    DateTimeOffset UpdatedUtc);
