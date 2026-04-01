using Farsight.RPC.Providers.Contracts;
using System.Net;
using System.Net.Http.Json;
using static Farsight.RPC.Providers.Sdk.Client.IRpcProvidersClient;

namespace Farsight.RPC.Providers.Sdk.Client;

internal sealed class RpcProvidersClient(HttpClient client, RpcProvidersClientOptions options) : IRpcProvidersClient
{
    private readonly HttpClient _client = client;
    private readonly RpcProvidersClientOptions _options = options;

    public async Task<GetProvidersResult> GetProvidersAsync(HostEnvironment environment, string application, string chain, CancellationToken cancellationToken = default)
    {
        var response = await _client.GetAsync($"/api/providers/{environment}/{Uri.EscapeDataString(application)}/{Uri.EscapeDataString(chain)}", cancellationToken);

        switch (response.StatusCode)
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

    public async Task<GetRealTimeResult> GetRealTimeAsync(HostEnvironment environment, string application, string chain, CancellationToken cancellationToken = default)
    {
        var response = await _client.GetAsync($"/api/providers/{environment}/{Uri.EscapeDataString(application)}/{Uri.EscapeDataString(chain)}/realtime", cancellationToken);

        switch (response.StatusCode)
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

    public async Task<GetArchiveResult> GetArchiveAsync(HostEnvironment environment, string application, string chain, CancellationToken cancellationToken = default)
    {
        var response = await _client.GetAsync($"/api/providers/{environment}/{Uri.EscapeDataString(application)}/{Uri.EscapeDataString(chain)}/archive", cancellationToken);

        switch (response.StatusCode)
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

    public async Task<GetTracingResult> GetTracingAsync(HostEnvironment environment, string application, string chain, CancellationToken cancellationToken = default)
    {
        var response = await _client.GetAsync($"/api/providers/{environment}/{Uri.EscapeDataString(application)}/{Uri.EscapeDataString(chain)}/tracing", cancellationToken);

        switch (response.StatusCode)
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
}
