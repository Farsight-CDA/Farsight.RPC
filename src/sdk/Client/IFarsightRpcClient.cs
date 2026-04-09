using Farsight.Rpc.Types;

namespace Farsight.Rpc.Sdk.Client;

public partial interface IFarsightRpcClient
{
    /// <summary>
    /// Represents the possible outcomes of an RPC lookup request.
    /// </summary>
    public abstract record GetRpcsResult
    {
        /// <summary>
        /// Represents a successful RPC lookup.
        /// </summary>
        /// <param name="Rpcs">The RPC endpoints available to the configured API key, grouped by chain name.</param>
        /// <param name="Providers">The providers referenced by the returned RPC endpoints.</param>
        public sealed record Success(Dictionary<string, RpcEndpointDto[]> Rpcs, RpcProviderDto[] Providers) : GetRpcsResult;

        /// <summary>
        /// Represents a response where the provided API key was not found.
        /// </summary>
        public sealed record NotFound : GetRpcsResult
        {
            internal static NotFound Instance { get; } = new();
        }
    }

    /// <summary>
    /// Gets the RPC endpoints available to the configured API key.
    /// </summary>
    /// <param name="cancellationToken">The token used to cancel the operation.</param>
    /// <returns>The RPC endpoints and provider metadata for the configured API key.</returns>
    public Task<GetRpcsResult> GetRpcsAsync(CancellationToken cancellationToken = default);
}
