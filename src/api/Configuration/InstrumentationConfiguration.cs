using Farsight.Common;
using System.ComponentModel.DataAnnotations;

namespace Farsight.Rpc.Api.Configuration;

[ConfigOption(SectionName = "Instrumentation")]
public class InstrumentationConfiguration
{
    public bool EnableMetrics { get; init; } = true;
    [Range(1, 65535)]
    public int MetricsPort { get; init; } = 8888;

    public bool EnableLogs { get; init; } = false;
    public string? LogsOTLPUrl { get; init; }
}
