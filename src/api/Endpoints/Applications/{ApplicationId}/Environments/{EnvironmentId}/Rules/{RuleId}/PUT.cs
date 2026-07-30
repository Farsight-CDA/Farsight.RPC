using Farsight.Rpc.Api.Auth;
using Farsight.Rpc.Api.Persistence;
using Farsight.Rpc.Types;
using FastEndpoints;
using FluentValidation;
using Microsoft.EntityFrameworkCore;

namespace Farsight.Rpc.Api.Endpoints.Applications.Rules;

public sealed class PUT(AppDbContext dbContext) : Endpoint<PUT.Request>
{
    public sealed record Request(
        [property: RouteParam] Guid ApplicationId,
        [property: RouteParam] Guid EnvironmentId,
        [property: RouteParam] Guid RuleId,
        RpcCapability[]? AllOf,
        RpcCapability[]? AnyOf
    );

    public sealed class Validator : Validator<Request>
    {
        public Validator()
        {
            RuleFor(x => x)
                .Must(static request => request.AllOf is not null || request.AnyOf is not null)
                .WithMessage("At least one field (AllOf or AnyOf) must be provided.");

            When(
                x => x.AllOf is not null,
                () =>
                {
                    RuleFor(x => x.AllOf!)
                        .Must(static capabilities => capabilities.Distinct().Count() == capabilities.Length)
                        .WithMessage("AllOf must not contain duplicates.");

                    RuleForEach(x => x.AllOf!)
                        .IsInEnum()
                        .WithMessage("AllOf capability is invalid.");
                });

            When(
                x => x.AnyOf is not null,
                () =>
                {
                    RuleFor(x => x.AnyOf!)
                        .Must(static capabilities => capabilities.Distinct().Count() == capabilities.Length)
                        .WithMessage("AnyOf must not contain duplicates.");

                    RuleForEach(x => x.AnyOf!)
                        .IsInEnum()
                        .WithMessage("AnyOf capability is invalid.");
                });
        }
    }

    public override void Configure()
    {
        Put("/api/Applications/{ApplicationId}/Environments/{EnvironmentId}/Rules/{RuleId}");
        Roles(AuthRoles.ADMIN);
    }

    public override async Task HandleAsync(Request req, CancellationToken ct)
    {
        var rule = await dbContext.RpcRules.SingleOrDefaultAsync(rule =>
            rule.ApplicationId == req.ApplicationId &&
            rule.EnvironmentId == req.EnvironmentId &&
            rule.Id == req.RuleId, ct);

        if(rule is null)
        {
            ThrowError("Rule not found.", 404);
        }

        var allOf = req.AllOf ?? rule.AllOf;
        var anyOf = req.AnyOf ?? rule.AnyOf;

        if(allOf.Length == 0 && anyOf.Length == 0)
        {
            ThrowError("At least one AllOf or AnyOf capability is required.");
        }

        if(allOf.Intersect(anyOf).Any())
        {
            ThrowError("A capability cannot appear in both AllOf and AnyOf.");
        }

        if(req.AllOf is not null)
        {
            rule.AllOf = [.. req.AllOf.Order()];
        }

        if(req.AnyOf is not null)
        {
            rule.AnyOf = [.. req.AnyOf.Order()];
        }

        await dbContext.SaveChangesAsync(ct);
        await Send.NoContentAsync(ct);
    }
}
