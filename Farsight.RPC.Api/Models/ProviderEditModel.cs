using Farsight.RPC.Types;

namespace Farsight.RPC.Api.Models;

public sealed class ProviderEditModel
{
    public Guid? Id { get; set; }

    public RpcEndpointType Type { get; set; }

    public HostEnvironment Environment { get; set; }

    public Guid ApplicationId { get; set; }

    public Guid ChainId { get; set; }

    public Guid ProviderId { get; set; }

    public string Address { get; set; } = String.Empty;

    public ulong? IndexerStepSize { get; set; }

    public ulong? DexIndexStepSize { get; set; }

    public ulong? IndexBlockOffset { get; set; }

    public TracingMode TracingMode { get; set; } = TracingMode.Unknown;
}
