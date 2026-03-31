using Farsight.RPC.Providers.Contracts;

namespace Farsight.RPC.Providers.Data.Entities;

public sealed class TracingEndpointEntity : ProviderEndpointEntity
{
    public TracingMode TracingMode { get; set; } = TracingMode.Unknown;
}
