using Farsight.Rpc.Api.Auth;
using Farsight.Rpc.Api.Persistence;
using Farsight.Rpc.Api.Persistence.Entities.Rpc;
using Farsight.Rpc.Api.Services;
using Farsight.Rpc.Api.Validation;
using Farsight.Rpc.Types;
using FastEndpoints;
using FluentValidation;
using Microsoft.EntityFrameworkCore;

namespace Farsight.Rpc.Api.Endpoints.Applications.Rpcs.Tracing;

public sealed class POST(AppDbContext dbContext) : Endpoint<POST.Request>
{
    public sealed record Request(
        [property: RouteParam] Guid ApplicationId,
        HostEnvironment? Environment,
        string Chain,
        Uri Address,
        Guid ProviderId,
        TracingMode? TracingMode
    );

    public sealed class Validator : Validator<Request>
    {
        public Validator(ChainService chainService)
        {
            RuleFor(x => x.Environment)
                .NotNull()
                .WithMessage("Environment is required.")
                .IsInEnum()
                .WithMessage("Environment is invalid.");

            RuleFor(x => x.Chain)
                .ApplyChainValidation(chainService);

            RuleFor(x => x.Address)
                .ApplyRpcAddressValidation();

            RuleFor(x => x.ProviderId)
                .Must(static providerId => providerId != Guid.Empty)
                .WithMessage("Provider is required.");

            RuleFor(x => x.TracingMode)
                .NotNull()
                .WithMessage("Tracing mode is required.")
                .IsInEnum()
                .WithMessage("Tracing mode is invalid.");
        }
    }

    public override void Configure()
    {
        Post("/api/Applications/{ApplicationId}/Rpcs/Tracing");
        Roles(AuthRoles.ADMIN);
    }

    public override async Task HandleAsync(Request req, CancellationToken ct)
    {
        if(!await dbContext.ConsumerApplications.AnyAsync(application => application.Id == req.ApplicationId, ct))
        {
            ThrowError("Application not found.", 404);
        }

        if(!await dbContext.RpcProviders.AnyAsync(provider => provider.Id == req.ProviderId, ct))
        {
            ThrowError("RPC provider not found.", 404);
        }

        dbContext.TracingRpcs.Add(new RpcEndpoint.Tracing
        {
            Id = Guid.NewGuid(),
            ApplicationId = req.ApplicationId,
            Environment = req.Environment!.Value,
            Chain = req.Chain,
            Address = req.Address,
            ProviderId = req.ProviderId,
            TracingMode = req.TracingMode!.Value,
        });

        await dbContext.SaveChangesAsync(ct);
        await Send.NoContentAsync(ct);
    }
}
