namespace Farsight.Rpc.Types;

public enum RpcCapability
{
    Archive,
    DebugApi,
    TracingApi,
    StateOverrides,
    BlockOverrides,
    Subscriptions,
    GetLogs,
    SendRawTransaction,
    DebugJsTracers,
}
