using Farsight.RPC.Types;

namespace Farsight.RPC.Sdk.Client;

public interface IFarsightRPCClient
{
    Task<GetProvidersResult> GetProvidersAsync(string chain, CancellationToken cancellationToken = default);

    Task<GetRealTimeResult> GetRealTimeAsync(string chain, CancellationToken cancellationToken = default);

    Task<GetArchiveResult> GetArchiveAsync(string chain, CancellationToken cancellationToken = default);

    Task<GetTracingResult> GetTracingAsync(string chain, CancellationToken cancellationToken = default);

    Task<GetRateLimitsResult> GetRateLimitsAsync(CancellationToken cancellationToken = default);

    public abstract record GetProvidersResult
    {
        public sealed record Success(RpcProviderSetDto Providers) : GetProvidersResult;

        public sealed record NotFound : GetProvidersResult;

        public sealed record Unavailable : GetProvidersResult;
    }

    public abstract record GetRealTimeResult
    {
        public sealed record Success(IReadOnlyList<RealTimeRpcEndpointDto> Endpoints) : GetRealTimeResult;

        public sealed record NotFound : GetRealTimeResult;

        public sealed record Unavailable : GetRealTimeResult;
    }

    public abstract record GetArchiveResult
    {
        public sealed record Success(IReadOnlyList<ArchiveRpcEndpointDto> Endpoints) : GetArchiveResult;

        public sealed record NotFound : GetArchiveResult;

        public sealed record Unavailable : GetArchiveResult;
    }

    public abstract record GetTracingResult
    {
        public sealed record Success(IReadOnlyList<TracingRpcEndpointDto> Endpoints) : GetTracingResult;

        public sealed record NotFound : GetTracingResult;

        public sealed record Unavailable : GetTracingResult;
    }

    public abstract record GetRateLimitsResult
    {
        public sealed record Success(IReadOnlyList<ProviderRateLimitDto> RateLimits) : GetRateLimitsResult;

        public sealed record Unavailable : GetRateLimitsResult;
    }
}
