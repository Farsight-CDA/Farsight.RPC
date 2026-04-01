namespace Farsight.RPC.Providers.Contracts;

public sealed record ProviderRateLimitDto(
    string Provider,
    int RateLimit);
