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
                var chains = ChainRegistry.GetAllChains();
                var resolveProvider = (Guid providerId) => result.Providers.FirstOrDefault(x => x.Id == providerId)
                    ?? throw new InvalidOperationException($"RPC response referenced unknown provider '{providerId}'.");
                var rpcs = result.Rpcs.ToDictionary(
                    group => chains.FirstOrDefault(x => x.Name == group.Key)
                        ?? throw new InvalidOperationException($"RPC response referenced unknown chain '{group.Key}'."),
                    group => group.Value.Select<RpcEndpointDto, RpcEndpoint>(rpc => rpc switch
                    {
                        RpcEndpointDto.Realtime realtime => new RpcEndpoint.Realtime
                        {
                            Id = realtime.Id,
                            Address = realtime.Address,
                            Provider = resolveProvider(rpc.ProviderId),
                        },
                        RpcEndpointDto.Archive archive => new RpcEndpoint.Archive
                        {
                            Id = archive.Id,
                            Address = archive.Address,
                            Provider = resolveProvider(rpc.ProviderId),
                            IndexerStepSize = archive.IndexerStepSize,
                            IndexerBlockOffset = archive.IndexerBlockOffset,
                        },
                        RpcEndpointDto.Tracing tracing => new RpcEndpoint.Tracing
                        {
                            Id = tracing.Id,
                            Address = tracing.Address,
                            Provider = resolveProvider(rpc.ProviderId),
                            TracingMode = tracing.TracingMode,
                        },
                        _ => throw new NotSupportedException($"Unsupported RPC type '{rpc.GetType().Name}'.")
                    }).ToImmutableArray()
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
