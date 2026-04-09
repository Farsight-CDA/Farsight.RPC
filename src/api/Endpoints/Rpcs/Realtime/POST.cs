using Farsight.Rpc.Api.Auth;
using Farsight.Rpc.Api.Persistence;
using Farsight.Rpc.Api.Persistence.Entities.Rpc;
using Farsight.Rpc.Api.Services;
using Farsight.Rpc.Api.Validation;
using Farsight.Rpc.Types;
using FastEndpoints;
using FluentValidation;
using Microsoft.EntityFrameworkCore;

namespace Farsight.Rpc.Api.Endpoints.Rpcs.Realtime;

public sealed class POST(AppDbContext dbContext) : Endpoint<POST.Request>
{
    public sealed record Request(
        [property: RouteParam] Guid ApplicationId,
        HostEnvironment? Environment,
        string Chain,
        Uri Address,
        Guid ProviderId
    );

    public sealed class Validator : AbstractValidator<Request>
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
                .Cascade(CascadeMode.Stop)
                .NotNull()
                .WithMessage("Address is required.")
                .Must(static address => address.IsAbsoluteUri)
                .WithMessage("Address must be a valid absolute URI.");

            RuleFor(x => x.ProviderId)
                .Must(static providerId => providerId != Guid.Empty)
                .WithMessage("Provider is required.");
        }
    }

    public override void Configure()
    {
        Post("/api/applications/{applicationId}/rpcs/realtime");
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

        dbContext.RealtimeRpcs.Add(new RealtimeRpc
        {
            Id = Guid.NewGuid(),
            ApplicationId = req.ApplicationId,
            Environment = req.Environment!.Value,
            Chain = req.Chain,
            Address = req.Address,
            ProviderId = req.ProviderId,
        });

        await dbContext.SaveChangesAsync(ct);
        await Send.NoContentAsync(ct);
    }
}
