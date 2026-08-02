using Farsight.Chains;
using Farsight.Rpc.Types;
using System.Collections.Immutable;

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
        /// <param name="Rpcs">The RPC endpoints available to the provided API key, grouped by chain metadata.</param>
        /// <param name="PublicRpcs">The public RPC endpoints available to the provided API key, grouped by chain metadata.</param>
        /// <param name="PublicRpcsUpdatedAt">The timestamp of the last successful public RPC registry refresh.</param>
        /// <param name="Providers">The providers referenced by the returned RPC endpoints.</param>
        /// <param name="ErrorGroups">The globally configured RPC error groups.</param>
        public sealed record Success(
            Dictionary<ChainMetadata, ImmutableArray<RpcEndpoint>> Rpcs,
            Dictionary<ChainMetadata, ImmutableArray<Uri>> PublicRpcs,
            DateTimeOffset? PublicRpcsUpdatedAt,
            ImmutableArray<RpcProviderDto> Providers,
            ImmutableArray<RpcErrorGroupDto> ErrorGroups
        ) : GetRpcsResult;

        /// <summary>
        /// Represents a response where the provided API key was not found.
        /// </summary>
        public sealed record InvalidApiKey : GetRpcsResult
        {
            internal static InvalidApiKey Instance { get; } = new();
        }
    }

    /// <summary>
    /// Represents the possible outcomes of a wallet signing request.
    /// </summary>
    public abstract record SignResult
    {
        /// <summary>
        /// Represents a successful signing request.
        /// </summary>
        /// <param name="Signature">The signature produced by the wallet private key.</param>
        public sealed record Success(byte[] Signature) : SignResult;

        /// <summary>
        /// Represents a response where the provided wallet API key was not found.
        /// </summary>
        public sealed record InvalidApiKey : SignResult
        {
            internal static InvalidApiKey Instance { get; } = new();
        }

        /// <summary>
        /// Represents a response where the data is invalid for the wallet private key's curve.
        /// </summary>
        public sealed record InvalidData : SignResult
        {
            internal static InvalidData Instance { get; } = new();
        }
    }

    /// <summary>
    /// Gets the RPC endpoints available to the provided API key.
    /// </summary>
    /// <param name="apiKey">The API key used to authorize the request.</param>
    /// <param name="cancellationToken">The token used to cancel the operation.</param>
    /// <returns>The RPC endpoints and provider metadata for the provided API key.</returns>
    public Task<GetRpcsResult> GetRpcsAsync(string apiKey, CancellationToken cancellationToken = default);

    /// <summary>
    /// Signs data with the wallet private key associated with the provided wallet API key.
    /// </summary>
    /// <param name="apiKey">The wallet API key used to authorize the request.</param>
    /// <param name="data">The raw data to sign. Secp256k1 keys require exactly 32 bytes.</param>
    /// <param name="cancellationToken">The token used to cancel the operation.</param>
    /// <returns>The signature or the reason the request was rejected.</returns>
    public Task<SignResult> SignAsync(string apiKey, byte[] data, CancellationToken cancellationToken = default);
}
