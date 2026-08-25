using Farsight.Rpc.Api.Auth;
using Farsight.Rpc.Api.Common.Extensions;
using Farsight.Rpc.Api.Persistence;
using Farsight.Rpc.Api.Persistence.Entities.Rpc;
using Farsight.Rpc.Types;
using FastEndpoints;
using FluentValidation;
using Microsoft.EntityFrameworkCore;

namespace Farsight.Rpc.Api.Endpoints.Applications.Rules;

public sealed class POST(AppDbContext dbContext) : Endpoint<POST.Request>
{
    public sealed record Request(
        [property: RouteParam] Guid ApplicationId,
        [property: RouteParam] Guid EnvironmentId,
        string[] Chains,
        RpcCapability[] AllOf,
        RpcCapability[] AnyOf,
        RpcRuleSeverity Severity
    );

    public sealed class Validator : Validator<Request>
    {
        public Validator()
        {
            RuleFor(x => x.Chains)
                .NotNull()
                .WithMessage("Chains is required.")
                .Must(static chains => chains is null || chains.Distinct(StringComparer.OrdinalIgnoreCase).Count() == chains.Length)
                .WithMessage("Chains must not contain duplicates.");

            RuleForEach(x => x.Chains!)
                .ApplyChainValidation();

            RuleFor(x => x.AllOf)
                .NotNull()
                .WithMessage("AllOf is required.")
                .Must(static capabilities => capabilities is null || capabilities.Distinct().Count() == capabilities.Length)
                .WithMessage("AllOf must not contain duplicates.");

            RuleForEach(x => x.AllOf!)
                .IsInEnum()
                .WithMessage("AllOf capability is invalid.");

            RuleFor(x => x.AnyOf)
                .NotNull()
                .WithMessage("AnyOf is required.")
                .Must(static capabilities => capabilities is null || capabilities.Distinct().Count() == capabilities.Length)
                .WithMessage("AnyOf must not contain duplicates.");

            RuleForEach(x => x.AnyOf!)
                .IsInEnum()
                .WithMessage("AnyOf capability is invalid.");

            RuleFor(x => x.Severity)
                .IsInEnum()
                .WithMessage("Severity is invalid.");

            RuleFor(x => x)
                .Must(static request => request.AllOf is null || request.AnyOf is null || request.AllOf.Length > 0 || request.AnyOf.Length > 0)
                .WithMessage("At least one AllOf or AnyOf capability is required.")
                .Must(static request => request.AllOf is null || request.AnyOf is null || !request.AllOf.Intersect(request.AnyOf).Any())
                .WithMessage("A capability cannot appear in both AllOf and AnyOf.");
        }
    }

    public override void Configure()
    {
        Post("/api/Applications/{ApplicationId}/Environments/{EnvironmentId}/Rules");
        Roles(AuthRoles.ADMIN);
    }

    public override async Task HandleAsync(Request req, CancellationToken ct)
    {
        if(!await dbContext.ConsumerApplications.AnyAsync(application => application.Id == req.ApplicationId, ct))
        {
            ThrowError("Application not found.", 404);
        }

        if(!await dbContext.ApplicationEnvironments.AnyAsync(environment =>
            environment.ApplicationId == req.ApplicationId && environment.Id == req.EnvironmentId, ct))
        {
            ThrowError("Environment not found.", 404);
        }

        dbContext.RpcRules.Add(new RpcRule
        {
            Id = Guid.NewGuid(),
            ApplicationId = req.ApplicationId,
            EnvironmentId = req.EnvironmentId,
            Chains = [.. req.Chains.Order(StringComparer.Ordinal)],
            AllOf = [.. req.AllOf.Order()],
            AnyOf = [.. req.AnyOf.Order()],
            Severity = req.Severity,
        });

        await dbContext.SaveChangesAsync(ct);
        await Send.NoContentAsync(ct);
    }
}
