namespace Farsight.RPC.Providers.Data.Entities;

public sealed class ApiClientEntity
{
    public Guid Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public string ApiKeyHash { get; set; } = string.Empty;

    public bool IsEnabled { get; set; } = true;

    public DateTimeOffset CreatedUtc { get; set; }

    public DateTimeOffset UpdatedUtc { get; set; }
}
