namespace Farsight.RPC.Providers.Models;

public sealed record ProviderRateLimitRow(Guid ProviderId, string Provider, int? RateLimit);
