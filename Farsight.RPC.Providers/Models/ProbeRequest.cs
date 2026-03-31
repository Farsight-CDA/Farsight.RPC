using System.ComponentModel.DataAnnotations;
using Farsight.RPC.Providers.Contracts;

namespace Farsight.RPC.Providers.Models;

public sealed class ProbeRequest
{
    [Required]
    public RpcEndpointType Type { get; set; }

    [Required]
    [Url]
    public string Address { get; set; } = string.Empty;
}
