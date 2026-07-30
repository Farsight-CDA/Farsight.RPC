namespace Farsight.Rpc.Types;

public sealed record RpcEndpointDto
{
    public required Guid Id { get; init; }
    public required Uri Address { get; init; }
    public required Guid ProviderId { get; init; }
    public required RpcCapability[] Capabilities { get; init; }
    public required ulong? EthGetLogsLimit { get; init; }
    public required int Order { get; init; }
}
