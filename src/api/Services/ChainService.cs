using EtherSharp.Client;
using EtherSharp.Query;
using Farsight.Chains;
using Farsight.Common;
using Farsight.Common.Extensions;

namespace Farsight.Rpc.Api.Services;

public partial class ChainService : Singleton
{
    private static readonly TimeSpan _rpcValidationTimeout = TimeSpan.FromSeconds(3);

    public ReadOnlyMemory<ChainMetadata> Chains { get; } = ChainRegistry.GetAllChains();

    public bool IsRegisteredChain(string chainName)
        => Chains.Any(x => x.Name.Equals(chainName, StringComparison.OrdinalIgnoreCase));

    public async Task<ulong> ValidateRpcChainAsync(Uri address, string chain, CancellationToken cancellationToken = default)
    {
        using var cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        cts.CancelAfter(_rpcValidationTimeout);

        ulong expectedChainId = Chains.Single(x => x.Name.Equals(chain, StringComparison.OrdinalIgnoreCase)).ChainId;

        await using var client = address.Scheme is "ws" or "wss"
            ? EtherClientBuilder.CreateForWebsocket(address).BuildReadClient()
            : EtherClientBuilder.CreateForHttpRpc(address).BuildReadClient();

        return await ValidateRpcChainAsync(client, chain, cts.Token);
    }

    public async Task<ulong> ValidateRpcChainAsync(IEtherClient client, string chain, CancellationToken cancellationToken = default)
    {
        ulong expectedChainId = Chains.Single(x => x.Name.Equals(chain, StringComparison.OrdinalIgnoreCase)).ChainId;
        ulong actualChainId = await client.InitializeAsync(IQuery.GetChainId(), cancellationToken);

        if(actualChainId != expectedChainId)
        {
            throw new InvalidOperationException($"RPC for {chain} returned chain id {actualChainId}, expected {expectedChainId}.");
        }

        return actualChainId;
    }

    public async Task<bool> IsValidRpcAsync(Uri address, string chain, CancellationToken cancellationToken = default)
    {
        try
        {
            await ValidateRpcChainAsync(address, chain, cancellationToken);
            return true;
        }
        catch(Exception) when(!cancellationToken.IsCancellationRequested)
        {
            return false;
        }
    }
}
