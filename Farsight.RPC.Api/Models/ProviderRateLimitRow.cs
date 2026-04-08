namespace Farsight.RPC.Api.Models;

public sealed record ProviderRateLimitRow(Guid ProviderId, string Provider, int? RateLimit);
