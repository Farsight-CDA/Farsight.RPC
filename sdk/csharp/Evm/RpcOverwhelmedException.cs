namespace Farsight.Rpc.Sdk.Evm;

public sealed class RpcOverwhelmedException(string reason)
    : Exception($"RPC endpoint is overwhelmed: {reason}")
{
    public string Reason { get; } = reason;
}
