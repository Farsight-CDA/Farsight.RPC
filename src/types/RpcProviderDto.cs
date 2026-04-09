namespace Farsight.Rpc.Types;

public sealed record RpcProviderDto(
    Guid Id,
    string Name,
    int RateLimit
);
