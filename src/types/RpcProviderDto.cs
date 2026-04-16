using System.Text.Json.Serialization;

namespace Farsight.Rpc.Types;

public sealed record RpcProviderDto
{
    public Guid Id { get; init; }
    public string Name { get; init; }
    public int RateLimit { get; init; }

    [JsonConstructor]
    public RpcProviderDto(Guid id, string name, int rateLimit)
    {
        Id = id;
        Name = name;
        RateLimit = rateLimit;
    }
}
