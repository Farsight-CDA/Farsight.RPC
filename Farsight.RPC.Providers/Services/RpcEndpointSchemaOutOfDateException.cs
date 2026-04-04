namespace Farsight.RPC.Providers.Services;

public sealed class RpcEndpointSchemaOutOfDateException(string message) : InvalidOperationException(message)
{
}
