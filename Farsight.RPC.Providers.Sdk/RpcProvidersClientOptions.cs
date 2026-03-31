namespace Farsight.RPC.Providers.Sdk;

public sealed class RpcProvidersClientOptions
{
    public Uri? ApiUrl { get; set; }

    public string ApiKeyHeaderName { get; set; } = "X-Api-Key";

    public string? ApiKey { get; set; }
}
