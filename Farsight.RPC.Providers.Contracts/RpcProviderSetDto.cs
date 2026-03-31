namespace Farsight.RPC.Providers.Contracts;

public sealed record RpcProviderSetDto(
    HostEnvironment Environment,
    string Application,
    string Chain,
    IReadOnlyList<RealTimeRpcEndpointDto> RealTime,
    IReadOnlyList<ArchiveRpcEndpointDto> Archive,
    IReadOnlyList<TracingRpcEndpointDto> Tracing);
