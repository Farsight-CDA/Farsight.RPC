using Farsight.RPC.Providers.Contracts;

namespace Farsight.RPC.Providers.Persistence.Entities;

public sealed class TracingEndpointEntity : ProviderEndpointEntity
{
    public TracingMode TracingMode { get; set; } = TracingMode.Unknown;
}
