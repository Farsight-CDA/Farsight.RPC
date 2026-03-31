using Farsight.RPC.Providers.Contracts;

namespace Farsight.RPC.Providers.Models;

public sealed class ProviderListQuery
{
    public string? Search { get; set; }

    public HostEnvironment? Environment { get; set; }

    public RpcEndpointType? Type { get; set; }

    public ProviderSort Sort { get; set; } = ProviderSort.Application;
}
