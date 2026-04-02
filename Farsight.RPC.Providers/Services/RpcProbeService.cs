using Farsight.Common;
using Farsight.RPC.Providers.Contracts;
using Farsight.RPC.Providers.Models;
using System.Net.WebSockets;

namespace Farsight.RPC.Providers.Services;

public partial class RpcProbeService : Singleton
{
    [Inject] private readonly IHttpClientFactory _httpClientFactory;

    public async Task<ProbeResult> ProbeAsync(ProbeRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var uri = new Uri(request.Address, UriKind.Absolute);
            return uri.Scheme switch
            {
                "http" or "https" => await ProbeHttpAsync(uri, request.Type, cancellationToken),
                "ws" or "wss" => await ProbeWebSocketAsync(uri, request.Type, cancellationToken),
                _ => new ProbeResult(false, $"Unsupported URI scheme '{uri.Scheme}'.", null)
            };
        }
        catch (Exception ex)
        {
            return new ProbeResult(false, ex.Message, null);
        }
    }

    private async Task<ProbeResult> ProbeHttpAsync(Uri uri, RpcEndpointType type, CancellationToken cancellationToken)
    {
        var client = _httpClientFactory.CreateClient();
        client.Timeout = TimeSpan.FromSeconds(10);
        using var request = new HttpRequestMessage(HttpMethod.Get, uri);
        using var response = await client.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, cancellationToken);
        var endpointType = type switch
        {
            RpcEndpointType.RealTime => "Realtime RPC endpoint",
            RpcEndpointType.Archive => "Archive RPC endpoint",
            RpcEndpointType.Tracing => "Tracing RPC endpoint",
            _ => "RPC endpoint"
        };
        var message = response.IsSuccessStatusCode
            ? $"{endpointType} responded with HTTP {(int)response.StatusCode} during probe."
            : $"{endpointType} returned HTTP {(int)response.StatusCode} during probe. You can still save this RPC endpoint.";
        return new ProbeResult(response.IsSuccessStatusCode, message, null);
    }

    private static async Task<ProbeResult> ProbeWebSocketAsync(Uri uri, RpcEndpointType type, CancellationToken cancellationToken)
    {
        using var socket = new ClientWebSocket();
        using var timeoutCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        timeoutCts.CancelAfter(TimeSpan.FromSeconds(10));
        await socket.ConnectAsync(uri, timeoutCts.Token);
        await socket.CloseAsync(WebSocketCloseStatus.NormalClosure, "probe", timeoutCts.Token);
        var endpointType = type switch
        {
            RpcEndpointType.RealTime => "Realtime RPC endpoint",
            RpcEndpointType.Archive => "Archive RPC endpoint",
            RpcEndpointType.Tracing => "Tracing RPC endpoint",
            _ => "RPC endpoint"
        };
        return new ProbeResult(true, $"{endpointType} accepted a websocket connection.", null);
    }
}
