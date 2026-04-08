namespace Farsight.Rpc.Types;

public sealed record RealTimeRpcEndpointDto(
    Guid Id,
    HostEnvironment Environment,
    string Application,
    string Chain,
    string Provider,
    Uri Address,
    DateTimeOffset UpdatedUtc,
    DateTimeOffset? ProbedUtc);
