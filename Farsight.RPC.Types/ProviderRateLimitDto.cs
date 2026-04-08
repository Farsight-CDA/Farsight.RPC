namespace Farsight.Rpc.Types;

public sealed record ProviderRateLimitDto(
    string Provider,
    int RateLimit
);
