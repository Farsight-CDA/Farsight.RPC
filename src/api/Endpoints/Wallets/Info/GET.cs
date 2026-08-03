using Farsight.Rpc.Api.Cryptography;
using Farsight.Rpc.Api.Persistence;
using Farsight.Rpc.Types;
using FastEndpoints;
using FluentValidation;
using Microsoft.EntityFrameworkCore;

namespace Farsight.Rpc.Api.Endpoints.Wallets.Info;

public sealed class GET(AppDbContext dbContext) : Endpoint<GET.Request, WalletInfoDto>
{
    public sealed record Request(
        [property: FromHeader(ApiKeyHeaders.API_KEY)] string ApiKey
    )
    {
        public sealed class Validator : FastEndpoints.Validator<Request>
        {
            public Validator()
            {
                RuleFor(x => x.ApiKey)
                    .NotEmpty()
                    .WithMessage("API key is required.");
            }
        }
    }

    public override void Configure()
    {
        Get("/api/Wallets/Info");
        AllowAnonymous();
    }

    public override async Task HandleAsync(Request req, CancellationToken ct)
    {
        var apiKey = await dbContext.WalletApiKeys
            .Include(apiKey => apiKey.WalletPrivateKey)
            .SingleOrDefaultAsync(apiKey => apiKey.Key == req.ApiKey, ct);

        if(apiKey is null)
        {
            ThrowError("API key not found.", StatusCodes.Status403Forbidden);
        }

        var privateKey = apiKey.WalletPrivateKey
            ?? throw new InvalidOperationException("The API key has no associated private key.");
        string address = WalletAddressFormatter.FormatAddress(privateKey.AddressFormat, privateKey.PublicKey);

        apiKey.LastUsedAt = DateTimeOffset.UtcNow;
        await dbContext.SaveChangesAsync(ct);

        await Send.OkAsync(new WalletInfoDto(address), ct);
    }
}
