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
    public sealed class Request
    {
        public string? Name { get; init; }

        public int? RateLimit { get; init; }
    }

    public sealed class Validator : AbstractValidator<Request>
    {
        public Validator()
        {
            RuleFor(x => x.Name).ApplyStandardRules();

            RuleFor(x => x.RateLimit)
                .Cascade(CascadeMode.Stop)
                .NotNull()
                .WithMessage("Rate limit is required.")
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
        string name = req.Name!;
        int rateLimit = req.RateLimit!.Value;

        if(await dbContext.RpcProviders.AnyAsync(provider => provider.Name == name, ct))
        {
            ThrowError("An RPC provider with this name already exists.", 409);
        }

        var rpcProvider = new RpcProvider
        {
            Id = Guid.NewGuid(),
            Name = name,
            RateLimit = rateLimit,
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
