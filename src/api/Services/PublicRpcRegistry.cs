using EtherSharp.Client;
using EtherSharp.RPC.Modules.Eth;
using EtherSharp.RPC.Transport;
using Farsight.Chains;
using Farsight.Common;
using Farsight.Rpc.Api.Configuration;
using Farsight.Rpc.Api.Services.Chainlist;
using System.Collections.Immutable;

namespace Farsight.Rpc.Api.Services;

public partial class PublicRpcRegistry : Singleton
{
    [Inject]
    private readonly ChainlistApiClient _chainlistSource;
    [Inject]
    private readonly PublicRpcsConfiguration _publicRpcConfiguration;

    private ImmutableDictionary<string, ImmutableArray<Uri>> _publicRpcs = [];
    public DateTimeOffset? LastUpdatedAt { get; private set; }

    public ImmutableArray<Uri> GetWorkingRpcs(string chain)
        => _publicRpcs.TryGetValue(chain, out var endpoints) ? endpoints : [];

#if DEBUG
    protected override Task InitializeAsync(CancellationToken cancellationToken)
    {
        _logger.LogInformation("Public RPC probing is disabled in Debug builds");
        return Task.CompletedTask;
    }

    protected override Task RunAsync(CancellationToken cancellationToken)
        => Task.CompletedTask;
#else
    protected override Task InitializeAsync(CancellationToken cancellationToken)
        => RefreshPublicRPCsAsync(cancellationToken);

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
#endif

    private async Task RefreshPublicRPCsAsync(CancellationToken cancellationToken)
    {
        _logger.LogInformation("Refreshing public rpcs...");

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

            var rpcModule = client.AsInternal().Provider.GetRequiredService<IEthRpcModule>();
            (bool supported, var error) = await RpcCapabilityProbe.ProbeSendRawTransactionAsync(
                chainId,
                rpcModule,
                cancellationToken
            );

            if(!supported)
            {
                _logger.LogDebug(
                    "Chain({chainId}): Dropping RPC {rpc}: {error}",
                    chainId,
                    address,
                    error?.Error);
            }

            return supported;
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
