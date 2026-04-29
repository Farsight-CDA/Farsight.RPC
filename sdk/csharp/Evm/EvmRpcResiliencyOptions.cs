namespace Farsight.Rpc.Sdk.Evm;

public sealed class EvmRpcResiliencyOptions
{
    public static EvmRpcResiliencyOptions Default => new();

    public int MaxRetryAttempts { get; }
    public int MaxSoftOverwhelmedRetries { get; }
    public TimeSpan RetryDelay { get; }
    public TimeSpan MaxRetryDelay { get; }
    public TimeSpan RequestTimeout { get; }

    public EvmRpcResiliencyOptions(
        int maxRetryAttempts = 20,
        int maxSoftOverwhelmedRetries = 4,
        TimeSpan? retryDelay = null,
        TimeSpan? maxRetryDelay = null,
        TimeSpan? requestTimeout = null)
    {
        ArgumentOutOfRangeException.ThrowIfNegative(MaxRetryAttempts);
        ArgumentOutOfRangeException.ThrowIfNegative(MaxSoftOverwhelmedRetries);

        MaxRetryAttempts = maxRetryAttempts;
        MaxSoftOverwhelmedRetries = maxSoftOverwhelmedRetries;
        RetryDelay = retryDelay ?? TimeSpan.FromMilliseconds(150);
        MaxRetryDelay = maxRetryDelay ?? TimeSpan.FromSeconds(30);
        RequestTimeout = requestTimeout ?? TimeSpan.FromSeconds(60);

        if(RetryDelay < TimeSpan.Zero)
        {
            throw new ArgumentOutOfRangeException(nameof(retryDelay), retryDelay, "Retry delay cannot be negative.");
        }

        if(MaxRetryDelay < TimeSpan.Zero)
        {
            throw new ArgumentOutOfRangeException(nameof(maxRetryDelay), maxRetryDelay, "Maximum retry delay cannot be negative.");
        }

        if(RequestTimeout <= TimeSpan.Zero)
        {
            throw new ArgumentOutOfRangeException(nameof(requestTimeout), requestTimeout, "Request timeout must be positive.");
        }
    }
}
