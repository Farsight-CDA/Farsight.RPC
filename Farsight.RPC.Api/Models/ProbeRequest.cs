using Farsight.RPC.Types;

namespace Farsight.RPC.Api.Models;

public sealed class ProbeRequest
{
    public RpcEndpointType Type { get; set; }

    public string Address { get; set; } = String.Empty;
}
