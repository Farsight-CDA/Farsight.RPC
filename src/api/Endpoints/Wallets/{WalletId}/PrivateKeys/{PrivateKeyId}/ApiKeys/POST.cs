using Farsight.Rpc.Api.Auth;
using Farsight.Rpc.Api.Common.Extensions;
using Farsight.Rpc.Api.Persistence;
using Farsight.Rpc.Api.Persistence.Entities;
using FastEndpoints;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using System.Security.Cryptography;

namespace Farsight.Rpc.Api.Endpoints.Wallets.PrivateKeys.ApiKeys;

public sealed class POST(AppDbContext dbContext) : Endpoint<POST.Request, POST.Response>
{
    public sealed record Request(
        [property: RouteParam] Guid WalletId,
        [property: RouteParam] Guid PrivateKeyId,
        string Name
    )
    {
        public sealed class Validator : FastEndpoints.Validator<Request>
        {
            public Validator()
            {
                RuleFor(x => x.Name).ApplyNameValidation();
            }
        }
    }

    public new sealed record Response(
        Guid Id,
        string Name,
        string Key,
        DateTimeOffset? LastUsedAt
    );

    public override void Configure()
    {
        Post("/api/Wallets/{WalletId}/PrivateKeys/{PrivateKeyId}/ApiKeys");
        Roles(AuthRoles.ADMIN);
    }

    public override async Task HandleAsync(Request req, CancellationToken ct)
    {
        if(!await dbContext.WalletPrivateKeys.AnyAsync(privateKey => privateKey.WalletId == req.WalletId && privateKey.Id == req.PrivateKeyId, ct))
        {
            ThrowError("Private key not found.", StatusCodes.Status404NotFound);
        }

        var apiKey = new WalletApiKey
        {
            Id = Guid.NewGuid(),
            WalletPrivateKeyId = req.PrivateKeyId,
            Name = req.Name,
            Key = Convert.ToHexString(RandomNumberGenerator.GetBytes(32)).ToLowerInvariant(),
        };

        dbContext.WalletApiKeys.Add(apiKey);
        try
        {
            await dbContext.SaveChangesAsync(ct);
        }
        catch(DbUpdateException ex) when(ex.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation })
        {
            ThrowError("An API key with this value already exists.", StatusCodes.Status409Conflict);
        }

        await Send.OkAsync(new Response(apiKey.Id, apiKey.Name, apiKey.Key, apiKey.LastUsedAt), ct);
    }
}
