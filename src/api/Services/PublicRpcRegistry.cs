using Farsight.Common;
using Farsight.Rpc.Api.Configuration;
using System.Collections.Concurrent;
using System.Collections.Immutable;

namespace Farsight.Rpc.Api.Services;

public partial class PublicRpcRegistry : Singleton
{
    private volatile ImmutableDictionary<string, ImmutableArray<Uri>> _working = ImmutableDictionary<string, ImmutableArray<Uri>>.Empty;

    public ImmutableArray<Uri> GetWorkingRpcs(string chain)
        => _working.TryGetValue(chain, out var endpoints) ? endpoints : [];

    protected override async Task RunAsync(CancellationToken cancellationToken)
    {
        var chainlistSource = _provider.GetRequiredService<ChainlistPublicRpcSource>();
        var chainService = _provider.GetRequiredService<ChainService>();
        var configuration = _provider.GetRequiredService<PublicRpcsConfiguration>();

        while(!cancellationToken.IsCancellationRequested)
        {
            try
            {
                var candidates = await chainlistSource.FetchAsync(cancellationToken);
                var validRpcs = new ConcurrentDictionary<string, ConcurrentBag<Uri>>(StringComparer.OrdinalIgnoreCase);
                var candidateRpcs = candidates.SelectMany(group => group.Value.Select(address => (Chain: group.Key, Address: address))).Take(200);

                await Parallel.ForEachAsync(candidateRpcs, new ParallelOptions
                {
                    MaxDegreeOfParallelism = configuration.ValidationConcurrency,
                    CancellationToken = cancellationToken,
                }, async (candidate, ct) =>
                {
                    var uri = new Uri(candidate.Address, UriKind.Absolute);
                    if(!await chainService.IsValidRpcAsync(uri, candidate.Chain, ct))
                    {
                        return;
                    }

                    validRpcs.GetOrAdd(candidate.Chain, static _ => []).Add(uri);
                });

                _working = validRpcs.ToImmutableDictionary(
                    group => group.Key,
                    group => group.Value.OrderBy(uri => uri.AbsoluteUri, StringComparer.OrdinalIgnoreCase).ToImmutableArray(),
                    StringComparer.OrdinalIgnoreCase);

                _logger.LogInformation("Public RPC refresh completed with {EndpointCount} validated endpoints across {ChainCount} chains.", _working.Values.Sum(endpoints => endpoints.Length), _working.Count);
            }
            catch(Exception ex) when(!cancellationToken.IsCancellationRequested)
            {
                _logger.LogWarning(ex, "Public RPC refresh failed.");
            }

            await Task.Delay(configuration.RefreshInterval, cancellationToken);
        }
    }
}
