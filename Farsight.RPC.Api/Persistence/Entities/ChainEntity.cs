namespace Farsight.RPC.Api.Persistence.Entities;

public sealed class ChainEntity
{
    public Guid Id { get; set; }

    public string Name { get; set; } = String.Empty;
}
