using Farsight.Rpc.Types;
using System.Text.Json;

namespace Farsight.Rpc.Sdk.Client;

public sealed class FarsightRpcOptions
{
    public Uri ApiUrl { get; set; } = new Uri("https://rpc.farsight-cda.de");
    public string? ApiKey { get; set; }

    public JsonSerializerOptions SerializerOptions { get; set; } = FarsightRpcJson.Default;
}
