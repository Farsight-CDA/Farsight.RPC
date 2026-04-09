namespace Farsight.Rpc.Types;

public sealed record ApplicationSummary(Guid Id, string Name, int ApiKeyCount, int RpcCount);
