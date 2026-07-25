using Farsight.Rpc.Api.Auth;
using Farsight.Rpc.Api.Persistence;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Farsight.Rpc.Api.Endpoints.Auth.SecurityKeys;

public sealed class GET(AppDbContext dbContext) : EndpointWithoutRequest<GET.Response[]>
{
    public new sealed record Response(
        Guid Id,
        string Name,
        DateTimeOffset CreatedAt,
        DateTimeOffset? LastUsedAt
    );

    public override void Configure()
    {
        Get("/api/Auth/SecurityKeys");
        Roles(AuthRoles.ADMIN);
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        string username = User.FindFirstValue(ClaimTypes.Name)
            ?? throw new InvalidOperationException("The authenticated user has no username claim.");

        var keys = await dbContext.UserSecurityKeys
            .Where(key => key.Username == username)
            .OrderBy(key => key.CreatedAt)
            .Select(key => new Response(key.Id, key.Name, key.CreatedAt, key.LastUsedAt))
            .ToArrayAsync(ct);

        await Send.OkAsync(keys, ct);
    }
}
