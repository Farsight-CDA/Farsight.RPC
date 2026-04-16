namespace Farsight.Rpc.Sdk.Client;

public sealed class FarsightRpcOptions
{
    public Uri ApiUrl { get; set; } = new Uri("https://rpc.farsight-cda.de");
    public string? ApiKey { get; set; }
}
