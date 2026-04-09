using Farsight.Rpc.Api.Auth;
using Farsight.Rpc.Api.Persistence;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;

namespace Farsight.Rpc.Api.Endpoints.RpcProviders;

public sealed class GET(AppDbContext dbContext) : EndpointWithoutRequest<GET.RpcProviderSummary[]>
{
    public sealed record RpcProviderSummary(
        Guid Id,
        string Name,
        int RateLimit,
        int RpcCount
    );

    public override void Configure()
    {
        Get("/api/RpcProviders");
        Roles(AuthRoles.ADMIN);
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var rpcProviders = await dbContext.RpcProviders
            .Select(provider => new RpcProviderSummary(
                provider.Id,
                provider.Name,
                provider.RateLimit,
                provider.Rpcs!.Count
            ))
            .ToArrayAsync(ct);

        await Send.OkAsync(rpcProviders, ct);
    }
}
