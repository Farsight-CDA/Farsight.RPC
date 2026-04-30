using Farsight.Rpc.Types;

namespace Farsight.Rpc.Sdk.Client;

/// <summary>
/// Represents an RPC endpoint with its provider metadata already resolved.
/// </summary>
public abstract record RpcEndpoint
{
    public required Guid Id { get; init; }
    public required Uri Address { get; init; }
    public required RpcProviderDto Provider { get; init; }

    /// <summary>
    /// Represents a realtime RPC endpoint.
    /// </summary>
    public sealed record Realtime : RpcEndpoint;

    /// <summary>
    /// Represents an archive RPC endpoint.
    /// </summary>
    public sealed record Archive : RpcEndpoint
    {
        public ulong IndexerStepSize { get; init; }
        public ulong IndexerBlockOffset { get; init; }
    }

    /// <summary>
    /// Represents a tracing RPC endpoint.
    /// </summary>
    public sealed record Tracing : RpcEndpoint
    {
        public required TracingMode TracingMode { get; init; }
    }
}
