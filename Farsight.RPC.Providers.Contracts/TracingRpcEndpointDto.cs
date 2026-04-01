namespace Farsight.RPC.Providers.Contracts;

public sealed record TracingRpcEndpointDto(
    Guid Id,
    HostEnvironment Environment,
    string Application,
    string Chain,
    string Provider,
    Uri Address,
    TracingMode TracingMode,
    DateTimeOffset UpdatedUtc,
    DateTimeOffset? ProbedUtc);
