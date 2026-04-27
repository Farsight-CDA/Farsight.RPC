using System.Text.Json.Serialization;

namespace Farsight.Rpc.Types;

public sealed record RpcErrorGroupDto
{
    public Guid Id { get; init; }
    public string Name { get; init; }
    public RpcErrorAction Action { get; init; }
    public string[] Errors { get; init; }

    [JsonConstructor]
    public RpcErrorGroupDto(Guid id, string name, RpcErrorAction action, string[] errors)
    {
        Id = id;
        Name = name;
        Action = action;
        Errors = errors;
    }
}
