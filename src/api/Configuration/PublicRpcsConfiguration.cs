using Farsight.Common;

namespace Farsight.Rpc.Api.Configuration;

[ConfigOption(SectionName = "PublicRpcs")]
public sealed class PublicRpcsConfiguration
{
    public TimeSpan RefreshInterval { get; init; } = TimeSpan.FromMinutes(30);
    public int ValidationConcurrency { get; init; } = 20;
    public TimeSpan ValidationTimeout { get; init; } = TimeSpan.FromSeconds(2);
}
