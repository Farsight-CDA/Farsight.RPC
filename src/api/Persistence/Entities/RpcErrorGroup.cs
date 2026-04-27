using Farsight.Rpc.Types;

namespace Farsight.Rpc.Api.Persistence.Entities;

public sealed record RpcErrorGroup
{
    public required Guid Id { get; init; }
    public required string Name { get; set; }
    public required RpcErrorAction Action { get; set; }
    public required string[] Errors { get; set; }
}
