using Farsight.Rpc.Api.Models;
using Farsight.Rpc.Api.Persistence;
using Farsight.Rpc.Api.Services;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;

namespace Farsight.Rpc.Api.Endpoints.Admin.Applications;

public sealed class GetApplicationsEndpoint(RpcProvidersDbContext dbContext) : EndpointWithoutRequest<IReadOnlyList<LookupItem>>
{
    public override void Configure()
    {
        Get("/api/admin/applications");
        Policies(AuthorizationPolicies.ADMIN_ONLY);
    }

    public override async Task HandleAsync(CancellationToken ct)
        => await Send.OkAsync(await dbContext.Applications.AsNoTracking().OrderBy(x => x.Name).Select(x => new LookupItem(x.Id, x.Name)).ToListAsync(ct), ct);
}
