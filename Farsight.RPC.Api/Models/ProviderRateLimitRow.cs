namespace Farsight.Rpc.Api.Models;

public sealed record ProviderRateLimitRow(
    Guid ProviderId,
    string Provider,
    int RateLimit
);
