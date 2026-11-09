
using Farsight.Common;
using System.ComponentModel.DataAnnotations;

namespace Farsight.Rpc.Api.Configuration;

[ConfigOption(SectionName = "Db")]
public sealed class DatabaseConfiguration
{
    [Required]
    public required string ConnectionString { get; init; }
}
