using Farsight.Chains;
using Farsight.Rpc.Types;
using System.Collections.Immutable;
using System.Net;
using System.Net.Http.Json;
using static Farsight.Rpc.Sdk.Client.IFarsightRpcClient;

namespace Farsight.Rpc.Sdk.Client;

public sealed class FarsightRpcClient : IFarsightRpcClient
{
    private readonly IHttpClientFactory? _httpClientFactory;
    private readonly HttpClient? _httpClient;

    internal FarsightRpcClient(IHttpClientFactory httpClientFactory)
    {
        ArgumentNullException.ThrowIfNull(httpClientFactory);
        _httpClientFactory = httpClientFactory;
    }

    public FarsightRpcClient(FarsightRpcOptions options)
    {
        ArgumentNullException.ThrowIfNull(options);
        _httpClient = new HttpClient();
        ConfigureClient(_httpClient, options);
    }

    public async Task<GetRpcsResult> GetRpcsAsync(string apiKey, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(apiKey);

        using var request = new HttpRequestMessage(HttpMethod.Get, "/api/Rpcs");
        request.Headers.Add(ApiKeyHeaders.API_KEY, apiKey);
        using var response = await CreateClient().SendAsync(request, cancellationToken);

        switch(response.StatusCode)
        {
            case HttpStatusCode.Forbidden:
                return GetRpcsResult.InvalidApiKey.Instance;
            case HttpStatusCode.OK:
                var result = await response.Content.ReadFromJsonAsync(FarsightRpcJsonContext.Default.ApiKeyRpcsDto, cancellationToken)
                    ?? throw new InvalidOperationException("Null response");
                var resolveProvider = (Guid providerId) => result.Providers.FirstOrDefault(x => x.Id == providerId)
                    ?? throw new InvalidOperationException($"RPC response referenced unknown provider '{providerId}'.");

                var rpcs = result.Rpcs.ToDictionary(
                    group => ChainRegistry.Chains.FirstOrDefault(x => x.Name == group.Key)
                        ?? throw new InvalidOperationException($"RPC response referenced unknown chain '{group.Key}'."),
                    group => group.Value.Select(rpc => new RpcEndpoint
                    {
                        Id = rpc.Id,
                        Address = rpc.Address,
                        Provider = resolveProvider(rpc.ProviderId),
                        Capabilities = rpc.Capabilities,
                        EthGetLogsLimit = rpc.EthGetLogsLimit,
                        Order = rpc.Order,
                    }).ToImmutableArray()
                );
                var publicRpcs = result.PublicRpcs.ToDictionary(
                    group => ChainRegistry.Chains.FirstOrDefault(x => x.Name == group.Key)
                        ?? throw new InvalidOperationException($"RPC response referenced unknown chain '{group.Key}'."),
                    group => group.Value
                );

                return new GetRpcsResult.Success(rpcs, publicRpcs, result.PublicRpcsUpdatedAt, result.Providers, result.ErrorGroups);
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
    }
}
