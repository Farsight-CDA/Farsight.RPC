namespace Farsight.Rpc.Types;

public sealed record RpcCapabilityError(
    RpcCapability Capability,
    string Error
);
