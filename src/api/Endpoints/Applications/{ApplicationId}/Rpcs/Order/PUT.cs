using Farsight.Rpc.Api.Auth;
using Farsight.Rpc.Api.Persistence;
using Farsight.Rpc.Api.Validation;
using FastEndpoints;
using FluentValidation;
using Microsoft.EntityFrameworkCore;

namespace Farsight.Rpc.Api.Endpoints.Applications.Rpcs.Order;

public sealed class PUT(AppDbContext dbContext) : Endpoint<PUT.Request>
{
    public sealed record Request(
        [property: RouteParam] Guid ApplicationId,
        Guid EnvironmentId,
        string Chain,
        Guid[] RpcIds
    );

    public sealed class Validator : Validator<Request>
    {
        public Validator()
        {
            RuleFor(x => x.EnvironmentId)
                .NotEmpty()
                .WithMessage("Environment is required.");

            RuleFor(x => x.Chain)
                .ApplyChainValidation();

            RuleFor(x => x.RpcIds)
                .Cascade(CascadeMode.Stop)
                .NotNull()
                .WithMessage("RPC IDs are required.")
                .Must(static ids => ids.All(id => id != Guid.Empty))
                .WithMessage("RPC IDs must not be empty GUIDs.")
                .Must(static ids => ids.Distinct().Count() == ids.Length)
                .WithMessage("RPC IDs must not contain duplicates.");
        }
    }

    public override void Configure()
    {
        Put("/api/Applications/{ApplicationId}/Rpcs/Order");
        Roles(AuthRoles.ADMIN);
    }

    public override async Task HandleAsync(Request req, CancellationToken ct)
    {
        var scope = await dbContext.ApplicationEnvironments
            .AsNoTracking()
            .Where(environment => environment.ApplicationId == req.ApplicationId && environment.Id == req.EnvironmentId)
            .Select(environment => new
            {
                ChainEnabled = environment.Chains.Contains(req.Chain),
                RpcIds = dbContext.Rpcs
                    .Where(rpc =>
                        rpc.ApplicationId == req.ApplicationId &&
                        rpc.EnvironmentId == req.EnvironmentId &&
                        rpc.Chain == req.Chain)
                    .Select(rpc => rpc.Id)
                    .ToArray(),
            })
            .SingleOrDefaultAsync(ct);

        if(scope is null)
        {
            ThrowError("Environment not found.", 404);
        }

        if(!scope.ChainEnabled)
        {
            ThrowError("Chain is not enabled for this environment.");
        }

        if(req.RpcIds.Length != scope.RpcIds.Length || !req.RpcIds.ToHashSet().SetEquals(scope.RpcIds))
        {
            ThrowError("RPC IDs must contain every RPC configured for this chain and environment exactly once.");
        }

        await using var transaction = await dbContext.Database.BeginTransactionAsync(ct);

        int resetRows = await dbContext.Rpcs
            .Where(rpc =>
                rpc.ApplicationId == req.ApplicationId &&
                rpc.EnvironmentId == req.EnvironmentId &&
                rpc.Chain == req.Chain)
            .ExecuteUpdateAsync(setters => setters.SetProperty(rpc => rpc.Order, rpc => -rpc.Order - 1), ct);

        if(resetRows != req.RpcIds.Length)
        {
            ThrowError("RPCs changed while their order was being updated.", 409);
        }

        int updatedRows = await dbContext.Database.ExecuteSqlInterpolatedAsync($"""
            UPDATE "Rpcs" AS rpc
            SET "Order" = ordering."Position"::integer - 1
            FROM unnest({req.RpcIds}) WITH ORDINALITY AS ordering("Id", "Position")
            WHERE rpc."Id" = ordering."Id"
              AND rpc."ApplicationId" = {req.ApplicationId}
              AND rpc."EnvironmentId" = {req.EnvironmentId}
              AND rpc."Chain" = {req.Chain};
            """, ct);

        if(updatedRows != req.RpcIds.Length)
        {
            ThrowError("RPCs changed while their order was being updated.", 409);
        }

        await transaction.CommitAsync(ct);
        await Send.NoContentAsync(ct);
    }
}
