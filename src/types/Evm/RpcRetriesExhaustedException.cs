namespace Farsight.Rpc.Types.Evm;

public sealed class RpcRetriesExhaustedException(string reason)
    : Exception($"RPC retries exhausted: {reason}")
{
    public string Reason { get; } = reason;
}
