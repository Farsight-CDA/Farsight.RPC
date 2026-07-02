using EtherSharp.Client;
using EtherSharp.Common.Exceptions;
using EtherSharp.Numerics;
using EtherSharp.RPC.Modules.Eth;
using EtherSharp.RPC.Transport;
using EtherSharp.Tx;
using EtherSharp.Tx.EIP1559;
using EtherSharp.Tx.Legacy;
using EtherSharp.Wallet;
using Farsight.Chains;
using Farsight.Common;
using Farsight.Rpc.Api.Configuration;
using Farsight.Rpc.Api.Services.Chainlist;
using System.Buffers;
using System.Collections.Immutable;

namespace Farsight.Rpc.Api.Services;

public partial class PublicRpcRegistry : Singleton
{
    private static readonly EtherHdWallet _validationSigner = EtherHdWallet.Create();

    [Inject]
    private readonly ChainlistApiClient _chainlistSource;
    [Inject]
    private readonly PublicRpcsConfiguration _publicRpcConfiguration;

    private ImmutableDictionary<string, ImmutableArray<Uri>> _publicRpcs = [];
    public DateTimeOffset? LastUpdatedAt { get; private set; }

    public ImmutableArray<Uri> GetWorkingRpcs(string chain)
        => _publicRpcs.TryGetValue(chain, out var endpoints) ? endpoints : [];

    protected override async Task InitializeAsync(CancellationToken cancellationToken)
        => await RefreshPublicRPCsAsync(cancellationToken);

    protected override async Task RunAsync(CancellationToken cancellationToken)
    {
        using var timer = new PeriodicTimer(_publicRpcConfiguration.RefreshInterval);

        while(await timer.WaitForNextTickAsync(cancellationToken))
        {
            try
            {
                await RefreshPublicRPCsAsync(cancellationToken);
            }
            catch(Exception ex) when(!cancellationToken.IsCancellationRequested)
            {
                _logger.LogError(ex, "Exception while refreshing public RPCs");
            }
        }
    }

    private async Task RefreshPublicRPCsAsync(CancellationToken cancellationToken)
    {
        var candidates = await _chainlistSource.FetchPublicRPCsAsync(cancellationToken);

        var results = new List<ChainlistPublicRpc>();
        var resultsLock = new Lock();

        await Parallel.ForAsync(0, candidates.Length, new ParallelOptions
        {
            MaxDegreeOfParallelism = Math.Max(1, _publicRpcConfiguration.ValidationConcurrency),
            CancellationToken = cancellationToken,
        }, async (i, ct) =>
        {
            using var cts = CancellationTokenSource.CreateLinkedTokenSource(ct);
            cts.CancelAfter(_publicRpcConfiguration.ValidationTimeout);

            var candidate = candidates[i];

            bool isValid = await ValidateRPCAsync(candidate.ChainId, candidate.Address, cts.Token);

            if(!isValid)
            {
                return;
            }

            lock(resultsLock)
            {
                results.Add(candidate);
            }
        });

        _publicRpcs = results
            .GroupBy(x => x.ChainId)
            .ToImmutableDictionary(
                x => ChainRegistry.Chains.First(y => y.ChainId == x.Key).Name,
                x => x.Select(y => y.Address).ToImmutableArray()
            );
        LastUpdatedAt = DateTimeOffset.UtcNow;

        _logger.LogInformation("Public RPC refresh completed, stored {validCount} / {totalCount} public endpoints",
            results.Count, candidates.Length);
    }

    private static readonly SearchValues<string> _validErrors = SearchValues.Create(
        [
            "insufficient funds",
            "Insufficient balance",
            "insufficient fee",
            "tx fee",
            "exceeds transaction sender account balance",
            "max fee per gas less than block base fee",
            "gas price less than block base fee",
            "already known",
            "transaction underpriced",
            "insufficient to cover the transaction cost",
            "Gas limit too low",
            "the sender account doesn't exist",
            "cannot pay gas",
            "Transaction fee too low",
            "invalid gas price",
            "gas fee cap is below the minimum base fee",
            "value transfer not allowed",
            "transaction gas price below minimum",
            "below current base fee"
        ],
        StringComparison.OrdinalIgnoreCase
    );

    private async Task<bool> ValidateRPCAsync(ulong chainId, Uri address, CancellationToken cancellationToken)
    {
        //ToDo: Install resiliency middleware
        var client = EtherClientBuilder.CreateEmpty()
            .WithRPCTransport(provider => address.Scheme is "ws" or "wss"
                ? new WssJsonRpcTransport(address, TimeSpan.FromSeconds(30), provider, [])
                : new HttpJsonRpcTransport(address, provider, []))
            .BuildReadClient();

        try
        {
            await client.InitializeAsync(forceNoQuery: true, cancellationToken);

            if(client.ChainId != chainId)
            {
                _logger.LogDebug("Chain({chainId}): Dropping RPC {rpc}: ChainId mismatch", chainId, address);
                return false;
            }

            var handler = new LegacyTxTypeHandler(_validationSigner);
            await handler.InitializeAsync(chainId, cancellationToken);

            string txBytes = handler.EncodeTxToBytes(
                ITxInput.ForEthTransfer(_validationSigner.Address, 1),
                LegacyTxParams.Default,
                new LegacyGasParams(21000, UInt256.Pow(10, 9)),
                1,
                out _
            );

            var rpcModule = client.AsInternal().Provider.GetRequiredService<IEthRpcModule>();

            await rpcModule.SendRawTransactionAsync(txBytes, cancellationToken);
            return false;
        }
        catch(RPCException ex)
        {
            bool isValid = ex.Message.ContainsAny(_validErrors);

            if(!isValid)
            {
                _logger.LogDebug("Chain({chainId}): Dropping RPC {rpc}: {error}", chainId, address, ex.Message);
            }

            return isValid;
        }
        catch(Exception ex)
        {
            if(ex.Message.Contains("<html"))
            {
                _logger.LogDebug("Chain({chainId}): Dropping RPC {rpc}: {type}: Truncated HTML Return", chainId, address, ex.GetType().Name);
                return false;
            }

            _logger.LogDebug("Chain({chainId}): Dropping RPC {rpc}: {type}:{error}", chainId, address, ex.GetType().Name, ex.Message);
            return false;
        }
    }
}
