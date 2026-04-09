namespace Farsight.Rpc.Api.Persistence.Entities;

public sealed class ProviderEntity
{
    public required Guid Id { get; init; }
    public required string Name { get; init; }
    public required int RateLimit { get; set; }
}
