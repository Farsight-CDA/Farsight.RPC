namespace Farsight.RPC.Providers.Persistence.Entities;

public sealed class ProviderRateLimitEntity
{
    public Guid ProviderId { get; set; }

    public ProviderEntity Provider { get; set; } = null!;

    public int RateLimit { get; set; }
}
