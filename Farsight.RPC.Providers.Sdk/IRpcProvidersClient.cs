using Farsight.RPC.Providers.Contracts;

namespace Farsight.RPC.Providers.Sdk;

public interface IRpcProvidersClient
{
    Task<GetProvidersResult> GetProvidersAsync(HostEnvironment environment, string application, string chain, CancellationToken cancellationToken = default);

    Task<GetRealTimeResult> GetRealTimeAsync(HostEnvironment environment, string application, string chain, CancellationToken cancellationToken = default);

    Task<GetArchiveResult> GetArchiveAsync(HostEnvironment environment, string application, string chain, CancellationToken cancellationToken = default);

    Task<GetTracingResult> GetTracingAsync(HostEnvironment environment, string application, string chain, CancellationToken cancellationToken = default);

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
}
