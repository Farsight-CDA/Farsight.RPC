using Farsight.Rpc.Types;

namespace Farsight.Rpc.Sdk.Client;

/// <summary>
/// Represents an RPC endpoint with its provider metadata already resolved.
/// </summary>
public sealed record RpcEndpoint
{
    public required Guid Id { get; init; }
    public required Uri Address { get; init; }
    public required RpcProviderDto Provider { get; init; }
    public required RpcCapability[] Capabilities { get; init; }
    public required int Order { get; init; }
}
