namespace Farsight.Rpc.Types;

public sealed record RpcCompatibilityReport(
    bool SupportsPush0,
    bool SupportsMCopy,
    bool SupportsTStore,
    bool SupportsBaseFee
);
