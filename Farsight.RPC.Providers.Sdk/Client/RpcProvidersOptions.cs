using System.Text.Json;

namespace Farsight.RPC.Providers.Sdk.Client;

public sealed class RpcProvidersOptions
{
    public Uri ApiUrl { get; set; } = new Uri("https://rpc-provider.farsight-cda.de");

    public string ApiKeyHeaderName { get; set; } = "X-Api-Key";

    public string? ApiKey { get; set; }

    public JsonSerializerOptions SerializerOptions { get; set; } = new(JsonSerializerDefaults.Web);
}
