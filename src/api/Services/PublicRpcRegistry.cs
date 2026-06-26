using Farsight.Common;
using Farsight.Rpc.Api.Configuration;
using System.Collections.Concurrent;
using System.Collections.Immutable;

namespace Farsight.Rpc.Api.Services;

public partial class PublicRpcRegistry : Singleton
{
    [Inject]
    private readonly ChainlistPublicRpcSource _chainlistSource;

    [Inject]
    private readonly ChainService _chainService;

    [Inject]
    private readonly PublicRpcsConfiguration _configuration;

    private volatile ImmutableDictionary<string, ImmutableArray<Uri>> _working = [];

    public ImmutableArray<Uri> GetWorkingRpcs(string chain)
        => _working.TryGetValue(chain, out var endpoints) ? endpoints : [];

    protected override async Task RunAsync(CancellationToken cancellationToken)
    {
        while(!cancellationToken.IsCancellationRequested)
        {
            try
            {
                var candidates = await _chainlistSource.FetchAsync(cancellationToken);
                var validRpcs = new ConcurrentDictionary<string, ConcurrentBag<Uri>>(StringComparer.OrdinalIgnoreCase);
                var candidateRpcs = candidates.SelectMany(group => group.Value.Select(address => (Chain: group.Key, Address: address)));

                await Parallel.ForEachAsync(candidateRpcs, new ParallelOptions
                {
                    MaxDegreeOfParallelism = Math.Max(1, _configuration.ValidationConcurrency),
                    CancellationToken = cancellationToken,
                }, async (candidate, ct) =>
                {
                    if(!Uri.TryCreate(candidate.Address, UriKind.Absolute, out var uri))
                    {
                        return;
                    }

                    var validation = await _chainService.IsValidRpcAsync(uri, candidate.Chain, _configuration.ValidationTimeout, cancellationToken: ct);
                    if(!validation.IsValid)
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

            await Task.Delay(_configuration.RefreshInterval, cancellationToken);
        }
    }
}
