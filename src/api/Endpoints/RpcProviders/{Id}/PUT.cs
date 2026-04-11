using Farsight.Rpc.Api.Auth;
using Farsight.Rpc.Api.Persistence;
using Farsight.Rpc.Api.Validation;
using FastEndpoints;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace Farsight.Rpc.Api.Endpoints.RpcProviders;

public sealed class PUT(AppDbContext dbContext) : Endpoint<PUT.Request>
{
    public sealed record Request(
        [property: RouteParam] Guid RpcProviderId,
        string Name
    );

    public sealed class Validator : Validator<Request>
    {
        public Validator()
        {
            RuleFor(x => x.Name).ApplyNameValidation();
        }
    }

    public override void Configure()
    {
        Put("/api/RpcProviders/{RpcProviderId}");
        Roles(AuthRoles.ADMIN);
    }

    public override async Task HandleAsync(Request req, CancellationToken ct)
    {
        var rpcProvider = await dbContext.RpcProviders
            .SingleOrDefaultAsync(provider => provider.Id == req.RpcProviderId, ct);

        if(rpcProvider is null)
        {
            ThrowError("RPC provider not found.", 404);
        }

        if(await dbContext.RpcProviders.AnyAsync(provider => provider.Id != req.RpcProviderId && provider.Name == req.Name, ct))
        {
            ThrowError("An RPC provider with this name already exists.", 409);
        }

        rpcProvider.Name = req.Name;

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
