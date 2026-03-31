namespace Farsight.RPC.Providers;

public sealed class BootstrapViewerClientOptions
{
    public const string SectionName = "BootstrapViewerClient";

    public string Name { get; set; } = "default-sdk";

    public string ApiKey { get; set; } = "change-me-viewer-key";
}
