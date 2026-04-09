using Farsight.Rpc.Types;

namespace Farsight.Rpc.Api.Persistence.Entities.Rpc;

public sealed class TracingRpc : RpcEndpoint
{
    public required TracingMode TracingMode { get; init; }
}
