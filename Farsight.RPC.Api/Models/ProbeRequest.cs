using Farsight.Rpc.Types;

namespace Farsight.Rpc.Api.Models;

public sealed class ProbeRequest
{
    public RpcEndpointType Type { get; set; }

    public string Address { get; set; } = String.Empty;
}
