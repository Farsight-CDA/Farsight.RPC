using Farsight.Rpc.Api.Auth;
using Farsight.Rpc.Api.Persistence;
using Farsight.Rpc.Api.Validation;
using FastEndpoints;
using FluentValidation;
using Microsoft.EntityFrameworkCore;

namespace Farsight.Rpc.Api.Endpoints.Applications.Rpcs.Archive;

public sealed class PUT(AppDbContext dbContext) : Endpoint<PUT.Request>
{
    public sealed record Request(
        [property: RouteParam] Guid ApplicationId,
        [property: RouteParam] Guid RpcId,
        Uri Address,
        Guid ProviderId,
        ulong IndexerStepSize,
        ulong? IndexerBlockOffset
    );

    public sealed class Validator : Validator<Request>
    {
        public Validator()
        {
            RuleFor(x => x.Address)
                .ApplyRpcAddressValidation();

            RuleFor(x => x.ProviderId)
                .Must(static providerId => providerId != Guid.Empty)
                .WithMessage("Provider is required.");

            RuleFor(x => x.IndexerStepSize)
                .Must(static value => value != default)
                .WithMessage("Indexer step size is required.");

            RuleFor(x => x.IndexerBlockOffset)
                .NotNull()
                .WithMessage("Indexer block offset is required.");
        }
    }

    public override void Configure()
    {
        Put("/api/Applications/{ApplicationId}/Rpcs/Archive/{RpcId}");
        Roles(AuthRoles.ADMIN);
    }

    public override async Task HandleAsync(Request req, CancellationToken ct)
    {
        if(!await dbContext.RpcProviders.AnyAsync(provider => provider.Id == req.ProviderId, ct))
        {
            ThrowError("RPC provider not found.", 404);
        }

        int updatedRows = await dbContext.ArchiveRpcs
            .Where(rpc => rpc.ApplicationId == req.ApplicationId && rpc.Id == req.RpcId)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(rpc => rpc.Address, req.Address)
                .SetProperty(rpc => rpc.ProviderId, req.ProviderId)
                .SetProperty(rpc => rpc.IndexerStepSize, req.IndexerStepSize)
                .SetProperty(rpc => rpc.IndexerBlockOffset, req.IndexerBlockOffset!.Value), ct);

        if(updatedRows == 0)
        {
            ThrowError("RPC not found.", 404);
        }

        await Send.NoContentAsync(ct);
    }
}
