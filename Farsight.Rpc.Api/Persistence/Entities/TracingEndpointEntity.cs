using Farsight.Rpc.Types;

namespace Farsight.Rpc.Api.Persistence.Entities;

public sealed class TracingEndpointEntity : ProviderEndpointEntity
{
    public TracingMode TracingMode { get; set; } = TracingMode.Unknown;
}
