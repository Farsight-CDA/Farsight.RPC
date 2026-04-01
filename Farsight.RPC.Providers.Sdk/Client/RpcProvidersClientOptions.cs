using System.Text.Json;

namespace Farsight.RPC.Providers.Sdk.Client;

internal sealed class RpcProvidersClientOptions
{
    public required Uri ApiUrl { get; init; }

    public required string ApiKeyHeaderName { get; init; }

    public string? ApiKey { get; init; }

    public required JsonSerializerOptions SerializerOptions { get; init; }

    public static RpcProvidersClientOptions Create(RpcProvidersOptions options)
    {
        if (options.ApiUrl is null)
        {
            throw new InvalidOperationException("Farsight RPC Providers ApiUrl must be configured.");
        }

        return new RpcProvidersClientOptions
        {
            ApiUrl = options.ApiUrl,
            ApiKeyHeaderName = string.IsNullOrWhiteSpace(options.ApiKeyHeaderName) ? "X-Api-Key" : options.ApiKeyHeaderName,
            ApiKey = options.ApiKey,
            SerializerOptions = options.SerializerOptions
        };
    }
}
