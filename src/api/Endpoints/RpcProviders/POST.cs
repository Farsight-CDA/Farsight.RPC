using Farsight.Rpc.Api.Auth;
using Farsight.Rpc.Api.Persistence;
using Farsight.Rpc.Api.Persistence.Entities;
using Farsight.Rpc.Api.Validation;
using FastEndpoints;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace Farsight.Rpc.Api.Endpoints.RpcProviders;

public sealed class POST(AppDbContext dbContext) : Endpoint<POST.Request>
{
    public sealed record Request(
        string Name,
        int RateLimit
    );

    public sealed class Validator : AbstractValidator<Request>
    {
        public Validator()
        {
            RuleFor(x => x.Name).ApplyNameValidation();

            RuleFor(x => x.RateLimit)
                .Cascade(CascadeMode.Stop)
                .GreaterThan(0)
                .WithMessage("Rate limit must be greater than 0.");
        }
    }

    public override void Configure()
    {
        Post("/api/rpc-providers");
        Roles(AuthRoles.ADMIN);
    }

    public override async Task HandleAsync(Request req, CancellationToken ct)
    {
        if(await dbContext.RpcProviders.AnyAsync(provider => provider.Name == req.Name, ct))
        {
            ThrowError("An RPC provider with this name already exists.", 409);
        }

        var rpcProvider = new RpcProvider
        {
            Id = Guid.NewGuid(),
            Name = req.Name,
            RateLimit = req.RateLimit,
        };

        dbContext.RpcProviders.Add(rpcProvider);

        try
        {
            await dbContext.SaveChangesAsync(ct);
        }
        catch(DbUpdateException ex) when(ex.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation })
        {
            ThrowError("An RPC provider with this name already exists.", 409);
        }

        await Send.NoContentAsync(ct);
    }
}
