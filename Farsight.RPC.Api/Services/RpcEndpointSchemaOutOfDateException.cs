namespace Farsight.RPC.Api.Services;

public sealed class RpcEndpointSchemaOutOfDateException(string message) : InvalidOperationException(message)
{
}
