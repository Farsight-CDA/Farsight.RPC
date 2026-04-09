
using Farsight.Common;
using System.ComponentModel.DataAnnotations;

namespace Farsight.Rpc.Api.Configuration;

[ConfigOption(SectionName = "Database")]
public sealed class DatabaseConfiguration
{
    [Required]
    public required string PostgresConnectionString { get; init; }
}
