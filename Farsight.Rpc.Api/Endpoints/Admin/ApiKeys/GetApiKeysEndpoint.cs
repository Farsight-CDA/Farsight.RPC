using Farsight.Rpc.Api.Models;
using Farsight.Rpc.Api.Persistence;
using Farsight.Rpc.Api.Services;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;

namespace Farsight.Rpc.Api.Endpoints.Admin.ApiKeys;

public sealed class GetApiKeysEndpoint(RpcProvidersDbContext dbContext) : EndpointWithoutRequest<IReadOnlyList<ApiClientListItem>>
{
    public override void Configure()
    {
        Get("/api/admin/api-keys");
        Policies(AuthorizationPolicies.ADMIN_ONLY);
    }

    public override async Task HandleAsync(CancellationToken ct)
        => await Send.OkAsync(await dbContext.ApiClients.AsNoTracking()
            .Include(x => x.Application)
            .OrderBy(x => x.Application!.Name)
            .ThenBy(x => x.Environment)
            .ThenBy(x => x.ApiKey)
            .Select(x => new ApiClientListItem(x.Id, x.ApiKey, x.ApplicationId, x.Application != null ? x.Application.Name : null, x.Environment, x.IsEnabled, x.CreatedUtc, x.UpdatedUtc))
            .ToListAsync(ct), ct);
}
