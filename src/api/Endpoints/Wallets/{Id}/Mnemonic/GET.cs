using Farsight.Rpc.Api.Auth;
using Farsight.Rpc.Api.Persistence;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;

namespace Farsight.Rpc.Api.Endpoints.Wallets.Mnemonic;

public sealed class GET(AppDbContext dbContext) : Endpoint<GET.Request, GET.Response>
{
    public sealed record Request(
        [property: RouteParam] Guid WalletId
    );

    public new sealed record Response(
        string Mnemonic
    );

    public override void Configure()
    {
        Get("/api/Wallets/{WalletId}/Mnemonic");
        Roles(AuthRoles.ADMIN);
    }

    public override async Task HandleAsync(Request req, CancellationToken ct)
    {
        var wallet = await dbContext.Wallets
            .AsNoTracking()
            .Where(wallet => wallet.Id == req.WalletId)
            .Select(wallet => new Response(wallet.Mnemonic))
            .SingleOrDefaultAsync(ct);

        if(wallet is null)
        {
            ThrowError("Wallet not found.", StatusCodes.Status404NotFound);
        }

        await Send.OkAsync(wallet, ct);
    }
}
