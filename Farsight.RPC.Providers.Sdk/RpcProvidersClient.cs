using System.Net.Http.Json;
using Farsight.RPC.Providers.Contracts;

namespace Farsight.RPC.Providers.Sdk;

public sealed class RpcProvidersClient(HttpClient httpClient) : IRpcProvidersClient
{
    public async Task<IRpcProvidersClient.GetProvidersResult> GetProvidersAsync(HostEnvironment environment, string application, string chain, CancellationToken cancellationToken = default)
        => await GetProvidersAsyncInternal(
            $"api/providers/{environment}/{Uri.EscapeDataString(application)}/{Uri.EscapeDataString(chain)}",
            cancellationToken);

    public async Task<IRpcProvidersClient.GetRealTimeResult> GetRealTimeAsync(HostEnvironment environment, string application, string chain, CancellationToken cancellationToken = default)
        => await GetRealTimeAsyncInternal(
            $"api/providers/{environment}/{Uri.EscapeDataString(application)}/{Uri.EscapeDataString(chain)}/realtime",
            cancellationToken);

    public async Task<IRpcProvidersClient.GetArchiveResult> GetArchiveAsync(HostEnvironment environment, string application, string chain, CancellationToken cancellationToken = default)
        => await GetArchiveAsyncInternal(
            $"api/providers/{environment}/{Uri.EscapeDataString(application)}/{Uri.EscapeDataString(chain)}/archive",
            cancellationToken);

    public async Task<IRpcProvidersClient.GetTracingResult> GetTracingAsync(HostEnvironment environment, string application, string chain, CancellationToken cancellationToken = default)
        => await GetTracingAsyncInternal(
            $"api/providers/{environment}/{Uri.EscapeDataString(application)}/{Uri.EscapeDataString(chain)}/tracing",
            cancellationToken);

    private async Task<IRpcProvidersClient.GetProvidersResult> GetProvidersAsyncInternal(string path, CancellationToken cancellationToken)
    {
        try
        {
            using var response = await httpClient.GetAsync(path, cancellationToken);
            if (response.StatusCode == System.Net.HttpStatusCode.NotFound)
            {
                return new IRpcProvidersClient.GetProvidersResult.NotFound();
            }

            if (!response.IsSuccessStatusCode)
            {
                return new IRpcProvidersClient.GetProvidersResult.Unavailable();
            }

            var payload = await response.Content.ReadFromJsonAsync<RpcProviderSetDto>(cancellationToken: cancellationToken);
            return payload is null
                ? new IRpcProvidersClient.GetProvidersResult.Unavailable()
                : new IRpcProvidersClient.GetProvidersResult.Success(payload);
        }
        catch (HttpRequestException)
        {
            return new IRpcProvidersClient.GetProvidersResult.Unavailable();
        }
        catch (TaskCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            return new IRpcProvidersClient.GetProvidersResult.Unavailable();
        }
    }

    private async Task<IRpcProvidersClient.GetRealTimeResult> GetRealTimeAsyncInternal(string path, CancellationToken cancellationToken)
    {
        try
        {
            using var response = await httpClient.GetAsync(path, cancellationToken);
            if (response.StatusCode == System.Net.HttpStatusCode.NotFound)
            {
                return new IRpcProvidersClient.GetRealTimeResult.NotFound();
            }

            if (!response.IsSuccessStatusCode)
            {
                return new IRpcProvidersClient.GetRealTimeResult.Unavailable();
            }

            var payload = await response.Content.ReadFromJsonAsync<List<RealTimeRpcEndpointDto>>(cancellationToken: cancellationToken);
            return payload is null
                ? new IRpcProvidersClient.GetRealTimeResult.Unavailable()
                : new IRpcProvidersClient.GetRealTimeResult.Success(payload);
        }
        catch (HttpRequestException)
        {
            return new IRpcProvidersClient.GetRealTimeResult.Unavailable();
        }
        catch (TaskCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            return new IRpcProvidersClient.GetRealTimeResult.Unavailable();
        }
    }

    private async Task<IRpcProvidersClient.GetArchiveResult> GetArchiveAsyncInternal(string path, CancellationToken cancellationToken)
    {
        try
        {
            using var response = await httpClient.GetAsync(path, cancellationToken);
            if (response.StatusCode == System.Net.HttpStatusCode.NotFound)
            {
                return new IRpcProvidersClient.GetArchiveResult.NotFound();
            }

            if (!response.IsSuccessStatusCode)
            {
                return new IRpcProvidersClient.GetArchiveResult.Unavailable();
            }

            var payload = await response.Content.ReadFromJsonAsync<List<ArchiveRpcEndpointDto>>(cancellationToken: cancellationToken);
            return payload is null
                ? new IRpcProvidersClient.GetArchiveResult.Unavailable()
                : new IRpcProvidersClient.GetArchiveResult.Success(payload);
        }
        catch (HttpRequestException)
        {
            return new IRpcProvidersClient.GetArchiveResult.Unavailable();
        }
        catch (TaskCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            return new IRpcProvidersClient.GetArchiveResult.Unavailable();
        }
    }

    private async Task<IRpcProvidersClient.GetTracingResult> GetTracingAsyncInternal(string path, CancellationToken cancellationToken)
    {
        try
        {
            using var response = await httpClient.GetAsync(path, cancellationToken);
            if (response.StatusCode == System.Net.HttpStatusCode.NotFound)
            {
                return new IRpcProvidersClient.GetTracingResult.NotFound();
            }

            if (!response.IsSuccessStatusCode)
            {
                return new IRpcProvidersClient.GetTracingResult.Unavailable();
            }

            var payload = await response.Content.ReadFromJsonAsync<List<TracingRpcEndpointDto>>(cancellationToken: cancellationToken);
            return payload is null
                ? new IRpcProvidersClient.GetTracingResult.Unavailable()
                : new IRpcProvidersClient.GetTracingResult.Success(payload);
        }
        catch (HttpRequestException)
        {
            return new IRpcProvidersClient.GetTracingResult.Unavailable();
        }
        catch (TaskCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            return new IRpcProvidersClient.GetTracingResult.Unavailable();
        }
    }
}
