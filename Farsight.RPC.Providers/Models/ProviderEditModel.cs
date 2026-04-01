using Farsight.RPC.Providers.Contracts;

namespace Farsight.RPC.Providers.Models;

public sealed class ProviderEditModel
{
    public Guid? Id { get; set; }

    public RpcEndpointType Type { get; set; }

    public HostEnvironment Environment { get; set; }

    public string Application { get; set; } = string.Empty;

    public string Chain { get; set; } = string.Empty;

    public string Provider { get; set; } = string.Empty;

    public string Address { get; set; } = string.Empty;

    public int Priority { get; set; }

    public bool IsEnabled { get; set; } = true;

    public ulong? IndexerStepSize { get; set; }

    public ulong? DexIndexStepSize { get; set; }

    public ulong? IndexBlockOffset { get; set; }

    public TracingMode TracingMode { get; set; } = TracingMode.Unknown;
}
