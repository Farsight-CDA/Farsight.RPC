using System.Text.Json;

namespace Farsight.RPC.Sdk.Client;

public sealed class FarsightRPCOptions
{
    public Uri ApiUrl { get; set; } = new Uri("https://rpc-provider.farsight-cda.de");

    public string? ApiKey { get; set; }

    public JsonSerializerOptions SerializerOptions { get; set; } = new(JsonSerializerDefaults.Web);
}
