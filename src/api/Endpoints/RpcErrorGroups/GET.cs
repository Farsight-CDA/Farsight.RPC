using Farsight.Rpc.Api.Auth;
using Farsight.Rpc.Api.Persistence;
using Farsight.Rpc.Types;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;

namespace Farsight.Rpc.Api.Endpoints.RpcErrorGroups;

public sealed class GET(AppDbContext dbContext) : EndpointWithoutRequest<RpcErrorGroupDto[]>
{
    public override void Configure()
    {
        Get("/api/RpcErrorGroups");
        Roles(AuthRoles.ADMIN);
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var groups = await dbContext.RpcErrorGroups
            .AsNoTracking()
            .OrderBy(group => group.Name)
            .Select(group => new RpcErrorGroupDto(group.Id, group.Name, group.Action, group.Errors))
            .ToArrayAsync(ct);

        await Send.OkAsync(groups, ct);
    }
}
