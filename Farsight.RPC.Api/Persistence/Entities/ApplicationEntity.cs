namespace Farsight.RPC.Api.Persistence.Entities;

public sealed class ApplicationEntity
{
    public Guid Id { get; set; }

    public string Name { get; set; } = String.Empty;
}
