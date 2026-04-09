namespace Farsight.Rpc.Sdk.Client;

internal sealed class FarsightRpcClient(IHttpClientFactory httpClientFactory, FarsightRpcOptions options) : IFarsightRpcClient
{
    private readonly IHttpClientFactory _httpClientFactory = httpClientFactory;
    private readonly FarsightRpcOptions _options = options;

    private HttpClient CreateClient() => _httpClientFactory.CreateClient(DependencyInjection.HTTP_CLIENT_NAME);

}
