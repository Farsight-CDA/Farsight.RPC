using Farsight.RPC.Providers.Contracts;

namespace Farsight.RPC.Providers.Models;

public sealed class ProbeRequest
{
    public RpcEndpointType Type { get; set; }

    public string Address { get; set; } = string.Empty;
}
