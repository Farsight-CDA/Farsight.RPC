using Farsight.Rpc.Types;
using System.Net;
using System.Net.Http.Json;
using static Farsight.Rpc.Sdk.Client.IFarsightRpcClient;

namespace Farsight.Rpc.Sdk.Client;

internal sealed class FarsightRpcClient(IHttpClientFactory httpClientFactory, FarsightRpcOptions options) : IFarsightRpcClient
{
    private readonly IHttpClientFactory _httpClientFactory = httpClientFactory;
    private readonly FarsightRpcOptions _options = options;

    public async Task<GetRpcsResult> GetRpcsAsync(CancellationToken cancellationToken = default)
    {
        using var response = await CreateClient().GetAsync("/api/Rpcs", cancellationToken);

        switch(response.StatusCode)
        {
            case HttpStatusCode.NotFound:
                return GetRpcsResult.NotFound.Instance;
            case HttpStatusCode.OK:
                var result = await response.Content.ReadFromJsonAsync<Dictionary<string, RpcEndpointDto[]>>(_options.SerializerOptions, cancellationToken)
                    ?? throw new InvalidOperationException("Null response");
                return new GetRpcsResult.Success(result);
            default:
                response.EnsureSuccessStatusCode();
                throw new InvalidOperationException();
        }
    }

    private HttpClient CreateClient() => _httpClientFactory.CreateClient(DependencyInjection.HTTP_CLIENT_NAME);
}
