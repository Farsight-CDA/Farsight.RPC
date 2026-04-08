namespace Farsight.RPC.Types;

public sealed record ProviderRateLimitDto(
    string Provider,
    int RateLimit);
