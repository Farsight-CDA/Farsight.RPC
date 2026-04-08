namespace Farsight.RPC.Providers.Persistence.Entities;

public sealed class ProviderEntity
{
    public Guid Id { get; set; }

    public string Name { get; set; } = String.Empty;
}
