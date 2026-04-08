using Farsight.Common;
using System.ComponentModel.DataAnnotations;

namespace Farsight.RPC.Providers.Configuration;

[ConfigOption(SectionName = SECTION_NAME)]
public sealed class ApiBindingConfiguration
{
    public const string SECTION_NAME = "ApiBinding";

    [Required]
    public required string ListeningAddress { get; init; }

    [Range(1, 65535)]
    public int Port { get; init; }
}
