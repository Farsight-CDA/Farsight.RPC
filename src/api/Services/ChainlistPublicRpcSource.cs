using Farsight.Common;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Farsight.Rpc.Api.Services;

public partial class ChainlistPublicRpcSource : Singleton
{
    private static readonly Uri _sourceUri = new("https://chainlist.org/rpcs.json");

    public async Task<Dictionary<string, string[]>> FetchAsync(CancellationToken cancellationToken = default)
    {
        var chainService = _provider.GetRequiredService<ChainService>();
        var httpClientFactory = _provider.GetRequiredService<IHttpClientFactory>();

        using var response = await httpClientFactory.CreateClient().GetAsync(_sourceUri, cancellationToken);
        response.EnsureSuccessStatusCode();

        await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
        var chains = await JsonSerializer.DeserializeAsync(stream, ChainlistJsonContext.Default.ChainlistChainArray, cancellationToken)
            ?? [];

        var knownChains = chainService.Chains.ToArray().ToDictionary(chain => chain.ChainId);
        var rpcs = new Dictionary<string, HashSet<string>>(StringComparer.OrdinalIgnoreCase);

        foreach(var chain in chains)
        {
            if(!knownChains.TryGetValue(chain.ChainId, out var knownChain))
            {
                continue;
            }

            if(!rpcs.TryGetValue(knownChain.Name, out var chainRpcs))
            {
                chainRpcs = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
                rpcs.Add(knownChain.Name, chainRpcs);
            }

            foreach(var rpc in chain.Rpc)
            {
                string address = rpc.Url.Trim();
                if(address.Contains("${", StringComparison.Ordinal) || !Uri.TryCreate(address, UriKind.Absolute, out var uri))
                {
                    continue;
                }

                if(uri.Scheme is not ("http" or "https" or "ws" or "wss"))
                {
                    continue;
                }

                chainRpcs.Add(uri.AbsoluteUri);
            }
        }

        return rpcs.ToDictionary(
            group => group.Key,
            group => group.Value.Order(StringComparer.OrdinalIgnoreCase).ToArray(),
            StringComparer.OrdinalIgnoreCase);
    }

    private sealed record ChainlistChain(
        [property: JsonPropertyName("chainId")] ulong ChainId,
        [property: JsonPropertyName("rpc")] ChainlistRpc[] Rpc
    );

    private sealed record ChainlistRpc(
        [property: JsonPropertyName("url")] string Url
    );

    [JsonSourceGenerationOptions(PropertyNameCaseInsensitive = true)]
    [JsonSerializable(typeof(ChainlistChain[]))]
    private sealed partial class ChainlistJsonContext : JsonSerializerContext;
}
