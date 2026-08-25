using Farsight.Rpc.Api.Auth;
using Farsight.Rpc.Api.Persistence;
using Farsight.Rpc.Types;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;

namespace Farsight.Rpc.Api.Endpoints.Applications;

public sealed class GETById(AppDbContext dbContext) : Endpoint<GETById.Request, GETById.Response>
{
    public sealed record EnvironmentSummary(
        Guid Id,
        string Name,
        string[] Chains,
        bool EnablePublicRpcs
    );

    public sealed record ApiKeySummary(
        Guid Id,
        Guid EnvironmentId,
        string Name,
        DateTimeOffset? LastUsedAt
    );

    public sealed record RuleSummary(
        Guid Id,
        Guid EnvironmentId,
        string[] Chains,
        RpcCapability[] AllOf,
        RpcCapability[] AnyOf,
        RpcRuleSeverity Severity
    );

    public sealed record Request(
        [property: RouteParam] Guid ApplicationId
    );

    public new sealed record Response(
        Guid Id,
        string Name,
        EnvironmentSummary[] Environments,
        ApiKeySummary[] ApiKeys,
        string Color,
        RuleSummary[] Rules
    );

    public override void Configure()
    {
        Get("/api/Applications/{ApplicationId}");
        Roles(AuthRoles.ADMIN);
    }

    public override async Task HandleAsync(Request req, CancellationToken ct)
    {
        var application = await dbContext.ConsumerApplications
            .AsNoTracking()
            .Where(a => a.Id == req.ApplicationId)
            .Select(a => new { a.Id, a.Name, a.Color })
            .SingleOrDefaultAsync(ct);

        if(application is null)
        {
            ThrowError("Application not found.", 404);
        }

        var apiKeys = await dbContext.ConsumerApiKeys
            .AsNoTracking()
            .Where(k => k.ApplicationId == req.ApplicationId)
            .OrderBy(k => k.Environment!.Name)
            .ThenBy(k => k.Id)
            .Select(k => new ApiKeySummary(k.Id, k.EnvironmentId, k.Name, k.LastUsedAt))
            .ToArrayAsync(ct);

        var environments = await dbContext.ApplicationEnvironments
            .AsNoTracking()
            .Where(environment => environment.ApplicationId == req.ApplicationId)
            .OrderBy(environment => environment.Name)
            .Select(environment => new EnvironmentSummary(environment.Id, environment.Name, environment.Chains, environment.EnablePublicRpcs))
            .ToArrayAsync(ct);

        var rules = await dbContext.RpcRules
            .AsNoTracking()
            .Where(rule => rule.ApplicationId == req.ApplicationId)
            .OrderBy(rule => rule.Environment!.Name)
            .ThenBy(rule => rule.Id)
            .Select(rule => new RuleSummary(rule.Id, rule.EnvironmentId, rule.Chains, rule.AllOf, rule.AnyOf, rule.Severity))
            .ToArrayAsync(ct);

        await Send.OkAsync(new Response(
            application.Id,
            application.Name,
            environments,
            apiKeys,
            application.Color,
            rules
        ), ct);
    }
}
