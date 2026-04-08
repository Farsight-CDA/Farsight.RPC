namespace Farsight.Rpc.Api.Services;

public sealed class RpcEndpointSchemaOutOfDateException(string message) : InvalidOperationException(message)
{
}
