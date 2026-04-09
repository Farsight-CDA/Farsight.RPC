using Farsight.Rpc.Api.Auth;
using Farsight.Rpc.Api.Persistence;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;

namespace Farsight.Rpc.Api.Endpoints.RpcProviders;

public sealed class GET(AppDbContext dbContext) : EndpointWithoutRequest<GET.RpcProviderSummary[]>
{
    public sealed record RpcProviderSummary(Guid Id, string Name, int RateLimit, int TracingCount, int RealtimeCount, int ArchiveCount);

    public override void Configure()
    {
        Get("/api/rpc-providers");
        Policies(AuthPolicies.ADMIN_ONLY);
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var rpcProviders = await dbContext.RpcProviders
            .Select(provider => new RpcProviderSummary(
                provider.Id,
                provider.Name,
                provider.RateLimit,
                provider.TracingRpcs!.Count,
                provider.RealtimeRpcs!.Count,
                provider.ArchiveRpcs!.Count
            ))
            .ToArrayAsync(ct);

        await Send.OkAsync(rpcProviders, ct);
    }
}
