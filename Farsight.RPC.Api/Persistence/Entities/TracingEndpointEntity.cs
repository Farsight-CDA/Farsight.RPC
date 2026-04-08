using Farsight.RPC.Types;

namespace Farsight.RPC.Api.Persistence.Entities;

public sealed class TracingEndpointEntity : ProviderEndpointEntity
{
    public TracingMode TracingMode { get; set; } = TracingMode.Unknown;
}
