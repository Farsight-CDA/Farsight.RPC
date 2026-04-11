using Farsight.Rpc.Api.Auth;
using Farsight.Rpc.Api.Persistence;
using Farsight.Rpc.Api.Persistence.Entities.Rpc;
using Farsight.Rpc.Api.Services;
using Farsight.Rpc.Api.Validation;
using FastEndpoints;
using FluentValidation;
using Microsoft.EntityFrameworkCore;

namespace Farsight.Rpc.Api.Endpoints.Applications.Rpcs.Archive;

public sealed class POST(AppDbContext dbContext) : Endpoint<POST.Request>
{
    public sealed record Request(
        [property: RouteParam] Guid ApplicationId,
        Guid EnvironmentId,
        string Chain,
        Uri Address,
        Guid ProviderId,
        ulong IndexerStepSize,
        ulong DexIndexerStepSize,
        ulong IndexerBlockOffset
    );

    public sealed class Validator : Validator<Request>
    {
        public Validator(ChainService chainService)
        {
            RuleFor(x => x.EnvironmentId)
                .Must(static environmentId => environmentId != Guid.Empty)
                .WithMessage("Environment is required.");

            RuleFor(x => x.Chain)
                .ApplyChainValidation(chainService);

            RuleFor(x => x.Address)
                .ApplyRpcAddressValidation();

            RuleFor(x => x.ProviderId)
                .Must(static providerId => providerId != Guid.Empty)
                .WithMessage("Provider is required.");

            RuleFor(x => x.IndexerStepSize)
                .Must(static value => value != default)
                .WithMessage("Indexer step size is required.");

            RuleFor(x => x.DexIndexerStepSize)
                .Must(static value => value != default)
                .WithMessage("DEX indexer step size is required.");

            RuleFor(x => x.IndexerBlockOffset)
                .Must(static value => value != default)
                .WithMessage("Indexer block offset is required.");
        }
    }

    public override void Configure()
    {
        Post("/api/Applications/{ApplicationId}/Rpcs/Archive");
        Roles(AuthRoles.ADMIN);
    }

    public override async Task HandleAsync(Request req, CancellationToken ct)
    {
        if(!await dbContext.ConsumerApplications.AnyAsync(application => application.Id == req.ApplicationId, ct))
        {
            ThrowError("Application not found.", 404);
        }

        if(!await dbContext.ApplicationEnvironments.AnyAsync(environment => environment.ApplicationId == req.ApplicationId && environment.Id == req.EnvironmentId, ct))
        {
            ThrowError("Environment not found.", 404);
        }

        if(!await dbContext.RpcProviders.AnyAsync(provider => provider.Id == req.ProviderId, ct))
        {
            ThrowError("RPC provider not found.", 404);
        }

        dbContext.ArchiveRpcs.Add(new RpcEndpoint.Archive
        {
            Id = Guid.NewGuid(),
            ApplicationId = req.ApplicationId,
            EnvironmentId = req.EnvironmentId,
            Chain = req.Chain,
            Address = req.Address,
            ProviderId = req.ProviderId,
            IndexerStepSize = req.IndexerStepSize,
            DexIndexerStepSize = req.DexIndexerStepSize,
            IndexerBlockOffset = req.IndexerBlockOffset,
        });

        await dbContext.SaveChangesAsync(ct);
        await Send.NoContentAsync(ct);
    }
}
