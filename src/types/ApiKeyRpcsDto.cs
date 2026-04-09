namespace Farsight.Rpc.Types;

public sealed record ApiKeyRpcsDto(
    Dictionary<string, RpcEndpointDto[]> Rpcs,
    RpcProviderDto[] Providers
);
