using Farsight.Rpc.Api.Auth;
using Farsight.Rpc.Api.Common.Extensions;
using Farsight.Rpc.Api.Persistence;
using FastEndpoints;
using FluentValidation;
using Microsoft.EntityFrameworkCore;

namespace Farsight.Rpc.Api.Endpoints.Wallets.PrivateKeys.ApiKeys;

public sealed class PUT(AppDbContext dbContext) : Endpoint<PUT.Request>
{
    public sealed record Request(
        [property: RouteParam] Guid WalletId,
        [property: RouteParam] Guid PrivateKeyId,
        [property: RouteParam] Guid ApiKeyId,
        string? Name
    )
    {
        public sealed class Validator : FastEndpoints.Validator<Request>
        {
            public Validator()
            {
                When(
                    x => x.Name is not null,
                    () => RuleFor(x => x.Name).ApplyNameValidation()
                );
            }
        }
    }

    public override void Configure()
    {
        Put("/api/Wallets/{WalletId}/PrivateKeys/{PrivateKeyId}/ApiKeys/{ApiKeyId}");
        Roles(AuthRoles.ADMIN);
    }

    public override async Task HandleAsync(Request req, CancellationToken ct)
    {
        var apiKey = await dbContext.WalletApiKeys
            .SingleOrDefaultAsync(apiKey => apiKey.Id == req.ApiKeyId
                && apiKey.WalletPrivateKeyId == req.PrivateKeyId
                && apiKey.WalletPrivateKey!.WalletId == req.WalletId,
                ct
            );

        if(apiKey is null)
        {
            ThrowError("API key not found.", StatusCodes.Status404NotFound);
        }

        if(req.Name is not null)
        {
            apiKey.Name = req.Name;
        }

        await dbContext.SaveChangesAsync(ct);
        await Send.NoContentAsync(ct);
    }
}
