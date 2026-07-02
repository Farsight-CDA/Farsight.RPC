using Farsight.Chains;
using Farsight.Common;
using Farsight.Rpc.Api.Services.Chainlist;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Farsight.Rpc.Api.Services;

public partial class ChainlistApiClient : Singleton
{
    private static readonly Uri _sourceUri = new("https://chainlist.org/rpcs.json");

    private static readonly JsonSerializerOptions _jsonOptions = new JsonSerializerOptions()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    [Inject]
    private readonly HttpClient _httpClient;

    public async Task<ChainlistPublicRpc[]> FetchPublicRPCsAsync(CancellationToken cancellationToken = default)
    {
        var chainRpcs = await _httpClient.GetFromJsonAsync<ChainlistChain[]>(_sourceUri, _jsonOptions, cancellationToken)
            ?? throw new InvalidOperationException("Chainlist returned empty result");
        return [.. chainRpcs
            .Where(x => ChainRegistry.Chains.Any(y => y.ChainId == x.ChainId))
            .SelectMany(x => x.Rpc.Select(y => new ChainlistPublicRpc(new Uri(y.Url), x.ChainId)))];
    }

    private sealed record ChainlistChain(
        ulong ChainId,
        ChainlistRpc[] Rpc
    );

    private sealed record ChainlistRpc(
        string Url
    );
}
