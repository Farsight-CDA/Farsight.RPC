namespace Farsight.Rpc.Api.Services.Chainlist;

public record struct ChainlistPublicRpc(
    Uri Address,
    ulong ChainId
);
