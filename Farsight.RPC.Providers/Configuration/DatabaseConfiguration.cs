
using Farsight.Common;
using System.ComponentModel.DataAnnotations;

namespace Farsight.RPC.Providers.Configuration;

[ConfigOption(SectionName = "Database")]
public sealed class DatabaseConfiguration
{
    [Required]
    public required string PostgresConnectionString { get; init; }
}
