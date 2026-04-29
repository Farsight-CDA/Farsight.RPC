using Farsight.Common;

namespace Farsight.Rpc.Api.Configuration;

[ConfigOption(SectionName = "Instrumentation")]
public class InstrumentationConfiguration
{
    public bool EnableMetrics { get; init; } = true;
    public string MetricsListenUrl { get; init; } = "http://*:8888";

    public bool EnableLogs { get; init; } = false;
    public string? LogsOTLPUrl { get; init; }
}
