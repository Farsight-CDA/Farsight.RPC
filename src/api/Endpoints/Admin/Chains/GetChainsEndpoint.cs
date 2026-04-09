using Farsight.Rpc.Api.Models;
using Farsight.Rpc.Api.Persistence;
using Farsight.Rpc.Api.Services;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;

namespace Farsight.Rpc.Api.Endpoints.Admin.Chains;

public sealed class GetChainsEndpoint(RpcProvidersDbContext dbContext) : EndpointWithoutRequest<IReadOnlyList<LookupItem>>
{
    public override void Configure()
    {
        Get("/api/admin/chains");
        Policies(AuthorizationPolicies.ADMIN_ONLY);
    }

    public override async Task HandleAsync(CancellationToken ct)
        => await Send.OkAsync(await dbContext.Chains.AsNoTracking().OrderBy(x => x.Name).Select(x => new LookupItem(x.Id, x.Name)).ToListAsync(ct), ct);
}
