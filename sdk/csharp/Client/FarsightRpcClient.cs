using Farsight.Chains;
using Farsight.Rpc.Types;
using System.Net;
using System.Net.Http.Json;
using static Farsight.Rpc.Sdk.Client.IFarsightRpcClient;

namespace Farsight.Rpc.Sdk.Client;

public sealed class FarsightRpcClient : IFarsightRpcClient
{
    private readonly IHttpClientFactory? _httpClientFactory;
    private readonly HttpClient? _httpClient;
    private readonly FarsightRpcOptions _options;

    internal FarsightRpcClient(IHttpClientFactory httpClientFactory, FarsightRpcOptions options)
    {
        ArgumentNullException.ThrowIfNull(httpClientFactory);
        ArgumentNullException.ThrowIfNull(options);
        _httpClientFactory = httpClientFactory;
        _options = options;
    }

    public FarsightRpcClient(FarsightRpcOptions options)
    {
        ArgumentNullException.ThrowIfNull(options);
        _httpClient = new HttpClient();
        ConfigureClient(_httpClient, options);
        _options = options;
    }

    public async Task<GetRpcsResult> GetRpcsAsync(CancellationToken cancellationToken = default)
    {
        using var response = await CreateClient().GetAsync("/api/Rpcs", cancellationToken);

        switch(response.StatusCode)
        {
            case HttpStatusCode.Forbidden:
                return GetRpcsResult.InvalidApiKey.Instance;
            case HttpStatusCode.OK:
                var result = await response.Content.ReadFromJsonAsync(FarsightRpcJsonContext.Default.ApiKeyRpcsDto, cancellationToken)
                    ?? throw new InvalidOperationException("Null response");
                var chainsByName = ChainRegistry.GetAllChains().ToDictionary(chain => chain.Name, StringComparer.Ordinal);
                var rpcs = result.Rpcs.ToDictionary(
                    group => chainsByName.TryGetValue(group.Key, out var chain)
                        ? chain
                        : throw new InvalidOperationException($"RPC response referenced unknown chain '{group.Key}'."),
                    group => group.Value
                );
                return new GetRpcsResult.Success(rpcs, result.Providers, result.ErrorGroups);
            default:
                response.EnsureSuccessStatusCode();
                throw new InvalidOperationException();
        }
    }

    private HttpClient CreateClient()
        => _httpClientFactory?.CreateClient(DependencyInjection.HTTP_CLIENT_NAME) ?? _httpClient!;

    internal static void ConfigureClient(HttpClient client, FarsightRpcOptions options)
    {
        client.BaseAddress = options.ApiUrl;

        if(!String.IsNullOrWhiteSpace(options.ApiKey))
        {
            client.DefaultRequestHeaders.Add(ApiKeyHeaders.API_KEY, options.ApiKey);
        }
    }
}
