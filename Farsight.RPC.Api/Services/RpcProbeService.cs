using Farsight.Common;
using Farsight.RPC.Types;
using Farsight.RPC.Api.Models;
using System.Net;
using System.Net.WebSockets;
using System.Text;

namespace Farsight.RPC.Api.Services;

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
        catch(Exception ex)
        {
            return new ProbeResult(false, BuildFailureMessage(ex), null);
        }
    }

    private async Task<ProbeResult> ProbeHttpAsync(Uri uri, RpcEndpointType type, CancellationToken cancellationToken)
    {
        var client = _httpClientFactory.CreateClient();
        client.Timeout = TimeSpan.FromSeconds(10);
        using var request = new HttpRequestMessage(HttpMethod.Get, uri);
        using var response = await client.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, cancellationToken);
        string endpointType = type switch
        {
            RpcEndpointType.RealTime => "Realtime RPC endpoint",
            RpcEndpointType.Archive => "Archive RPC endpoint",
            RpcEndpointType.Tracing => "Tracing RPC endpoint",
            _ => "RPC endpoint"
        };
        string message = response.IsSuccessStatusCode
            ? $"{endpointType} responded with HTTP {(int) response.StatusCode} during probe."
            : await BuildHttpFailureMessageAsync(endpointType, response, cancellationToken);
        return new ProbeResult(response.IsSuccessStatusCode, message, null);
    }

    private static async Task<ProbeResult> ProbeWebSocketAsync(Uri uri, RpcEndpointType type, CancellationToken cancellationToken)
    {
        using var socket = new ClientWebSocket();
        using var timeoutCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        timeoutCts.CancelAfter(TimeSpan.FromSeconds(10));
        await socket.ConnectAsync(uri, timeoutCts.Token);
        await socket.CloseAsync(WebSocketCloseStatus.NormalClosure, "probe", timeoutCts.Token);
        string endpointType = type switch
        {
            RpcEndpointType.RealTime => "Realtime RPC endpoint",
            RpcEndpointType.Archive => "Archive RPC endpoint",
            RpcEndpointType.Tracing => "Tracing RPC endpoint",
            _ => "RPC endpoint"
        };
        return new ProbeResult(true, $"{endpointType} accepted a websocket connection.", null);
    }

    private static async Task<string> BuildHttpFailureMessageAsync(string endpointType, HttpResponseMessage response, CancellationToken cancellationToken)
    {
        var message = new StringBuilder($"{endpointType} returned HTTP {(int) response.StatusCode}");
        if(!String.IsNullOrWhiteSpace(response.ReasonPhrase))
        {
            message.Append(' ').Append(response.ReasonPhrase);
        }

        message.Append(" during probe. You can still save this RPC endpoint.");

        if(response.Content is null)
        {
            return message.ToString();
        }

        string body = await response.Content.ReadAsStringAsync(cancellationToken);
        if(String.IsNullOrWhiteSpace(body))
        {
            return message.ToString();
        }

        message.AppendLine();
        message.AppendLine();
        message.AppendLine("Response body:");
        message.Append(TrimForDisplay(body));
        return message.ToString();
    }

    private static string BuildFailureMessage(Exception ex)
    {
        string message = ex switch
        {
            OperationCanceledException => "Probe timed out after 10 seconds.",
            WebSocketException websocketEx => $"WebSocket probe failed: {websocketEx.Message}",
            HttpRequestException httpRequestEx when httpRequestEx.StatusCode is HttpStatusCode statusCode
                => $"HTTP probe failed with status {(int) statusCode} {statusCode}: {httpRequestEx.Message}",
            HttpRequestException httpRequestEx => $"HTTP probe failed: {httpRequestEx.Message}",
            _ => ex.Message
        };

        if(ex.InnerException is null)
        {
            return message;
        }
        //
        return $"{message}{Environment.NewLine}Inner error: {ex.InnerException.Message}";
    }

    private static string TrimForDisplay(string value)
    {
        const int MAX_LENGTH = 2000;
        string trimmed = value.Trim();
        return trimmed.Length <= MAX_LENGTH
            ? trimmed
            : $"{trimmed[..MAX_LENGTH]}...";
    }
}
