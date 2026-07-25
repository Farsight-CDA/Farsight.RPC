using Farsight.Rpc.Api.Auth;
using Farsight.Rpc.Api.Persistence;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Farsight.Rpc.Api.Endpoints.Auth.SecurityKeys;

public sealed class DELETE(AppDbContext dbContext) : Endpoint<DELETE.Request>
{
    public sealed record Request(
        [property: RouteParam] Guid Id
    );

    public override void Configure()
    {
        Delete("/api/Auth/SecurityKeys/{Id}");
        Roles(AuthRoles.ADMIN);
    }

    public override async Task HandleAsync(Request req, CancellationToken ct)
    {
        if(!User.HasClaim(AuthenticationTokenService.SECURITY_KEY_VERIFIED_CLAIM, Boolean.TrueString))
        {
            await Send.ForbiddenAsync(ct);
            return;
        }

        string username = User.FindFirstValue(ClaimTypes.Name)
            ?? throw new InvalidOperationException("The authenticated user has no username claim.");

        int deletedRows = await dbContext.UserSecurityKeys
            .Where(key => key.Id == req.Id && key.Username == username)
            .ExecuteDeleteAsync(ct);
        if(deletedRows == 0)
        {
            ThrowError("Security key not found.", StatusCodes.Status404NotFound);
        }

        await Send.NoContentAsync(ct);
    }
}
