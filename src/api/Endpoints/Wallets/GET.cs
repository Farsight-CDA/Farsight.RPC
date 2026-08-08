using Farsight.Rpc.Api.Auth;
using Farsight.Rpc.Api.Persistence;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;

namespace Farsight.Rpc.Api.Endpoints.Wallets;

public sealed class GET(AppDbContext dbContext) : EndpointWithoutRequest<GET.WalletSummary[]>
{
    public sealed record WalletSummary(
        Guid Id,
        string Name,
        int PrivateKeyCount,
        string Color
    );

    public override void Configure()
    {
        Get("/api/Wallets");
        Roles(AuthRoles.ADMIN);
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var wallets = await dbContext.Wallets
            .AsNoTracking()
            .OrderBy(wallet => wallet.Color)
            .ThenBy(wallet => wallet.Name)
            .Select(wallet => new WalletSummary(
                wallet.Id,
                wallet.Name,
                wallet.PrivateKeys!.Count,
                wallet.Color
            ))
            .ToArrayAsync(ct);

        await Send.OkAsync(wallets, ct);
    }
}
