using System.ComponentModel.DataAnnotations;
using Farsight.RPC.Providers.Contracts;

namespace Farsight.RPC.Providers.Models;

public sealed class ProviderEditModel
{
    public Guid? Id { get; set; }

    [Required]
    public RpcEndpointType Type { get; set; }

    [Required]
    public HostEnvironment Environment { get; set; }

    [Required]
    public string Application { get; set; } = string.Empty;

    [Required]
    public string Chain { get; set; } = string.Empty;

    [Required]
    public string Provider { get; set; } = string.Empty;

    [Required]
    [Url]
    public string Address { get; set; } = string.Empty;

    public int Priority { get; set; }

    public bool IsEnabled { get; set; } = true;

    public ulong? IndexerStepSize { get; set; }

    public ulong? DexIndexStepSize { get; set; }

    public ulong? IndexBlockOffset { get; set; }

    public TracingMode TracingMode { get; set; } = TracingMode.Unknown;
}
