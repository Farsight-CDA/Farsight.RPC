using Farsight.RPC.Providers.Contracts;
using System.Net;
using System.Net.Http.Json;
using static Farsight.RPC.Providers.Sdk.Client.IRpcProvidersClient;

namespace Farsight.RPC.Providers.Sdk.Client;

internal sealed class RpcProvidersClient(IHttpClientFactory httpClientFactory, RpcProvidersOptions options) : IRpcProvidersClient
{
    private readonly IHttpClientFactory _httpClientFactory = httpClientFactory;
    private readonly RpcProvidersOptions _options = options;

    private HttpClient CreateClient() => _httpClientFactory.CreateClient(DependencyInjection.HttpClientName);

    public async Task<GetProvidersResult> GetProvidersAsync(string chain, CancellationToken cancellationToken = default)
    {
        using var response = await CreateClient().GetAsync($"/api/providers/{Uri.EscapeDataString(chain)}", cancellationToken);

        switch(response.StatusCode)
        {
            case HttpStatusCode.NotFound:
                return new GetProvidersResult.NotFound();
            case HttpStatusCode.ServiceUnavailable:
                return new GetProvidersResult.Unavailable();
            case HttpStatusCode.OK:
                var result = await response.Content.ReadFromJsonAsync<RpcProviderSetDto>(_options.SerializerOptions, cancellationToken)
                    ?? throw new InvalidOperationException("Null response");
                return new GetProvidersResult.Success(result);
            default:
                response.EnsureSuccessStatusCode();
                throw new InvalidOperationException();
        }
    }

    public async Task<GetRealTimeResult> GetRealTimeAsync(string chain, CancellationToken cancellationToken = default)
    {
        using var response = await CreateClient().GetAsync($"/api/providers/{Uri.EscapeDataString(chain)}/realtime", cancellationToken);

        switch(response.StatusCode)
        {
            case HttpStatusCode.NotFound:
                return new GetRealTimeResult.NotFound();
            case HttpStatusCode.ServiceUnavailable:
                return new GetRealTimeResult.Unavailable();
            case HttpStatusCode.OK:
                var result = await response.Content.ReadFromJsonAsync<List<RealTimeRpcEndpointDto>>(_options.SerializerOptions, cancellationToken)
                    ?? throw new InvalidOperationException("Null response");
                return new GetRealTimeResult.Success(result);
            default:
                response.EnsureSuccessStatusCode();
                throw new InvalidOperationException();
        }
    }

    public async Task<GetArchiveResult> GetArchiveAsync(string chain, CancellationToken cancellationToken = default)
    {
        using var response = await CreateClient().GetAsync($"/api/providers/{Uri.EscapeDataString(chain)}/archive", cancellationToken);

        switch(response.StatusCode)
        {
            case HttpStatusCode.NotFound:
                return new GetArchiveResult.NotFound();
            case HttpStatusCode.ServiceUnavailable:
                return new GetArchiveResult.Unavailable();
            case HttpStatusCode.OK:
                var result = await response.Content.ReadFromJsonAsync<List<ArchiveRpcEndpointDto>>(_options.SerializerOptions, cancellationToken)
                    ?? throw new InvalidOperationException("Null response");
                return new GetArchiveResult.Success(result);
            default:
                response.EnsureSuccessStatusCode();
                throw new InvalidOperationException();
        }
    }

    public async Task<GetTracingResult> GetTracingAsync(string chain, CancellationToken cancellationToken = default)
    {
        using var response = await CreateClient().GetAsync($"/api/providers/{Uri.EscapeDataString(chain)}/tracing", cancellationToken);

        switch(response.StatusCode)
        {
            case HttpStatusCode.NotFound:
                return new GetTracingResult.NotFound();
            case HttpStatusCode.ServiceUnavailable:
                return new GetTracingResult.Unavailable();
            case HttpStatusCode.OK:
                var result = await response.Content.ReadFromJsonAsync<List<TracingRpcEndpointDto>>(_options.SerializerOptions, cancellationToken)
                    ?? throw new InvalidOperationException("Null response");
                return new GetTracingResult.Success(result);
            default:
                response.EnsureSuccessStatusCode();
                throw new InvalidOperationException();
        }
    }

    public async Task<GetRateLimitsResult> GetRateLimitsAsync(CancellationToken cancellationToken = default)
    {
        using var response = await CreateClient().GetAsync("/api/rate-limits", cancellationToken);

        switch(response.StatusCode)
        {
            case HttpStatusCode.ServiceUnavailable:
                return new GetRateLimitsResult.Unavailable();
            case HttpStatusCode.OK:
                var result = await response.Content.ReadFromJsonAsync<List<ProviderRateLimitDto>>(_options.SerializerOptions, cancellationToken)
                    ?? throw new InvalidOperationException("Null response");
                return new GetRateLimitsResult.Success(result);
            default:
                response.EnsureSuccessStatusCode();
                throw new InvalidOperationException();
        }
    }
}
