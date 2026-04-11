using Farsight.Rpc.Api.Auth;
using Farsight.Rpc.Api.Persistence;
using Farsight.Rpc.Api.Services;
using Farsight.Rpc.Api.Validation;
using FastEndpoints;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace Farsight.Rpc.Api.Endpoints.Applications.Environments;

public sealed class PUT(AppDbContext dbContext) : Endpoint<PUT.Request>
{
    public sealed record Request(
        [property: RouteParam] Guid ApplicationId,
        [property: RouteParam] Guid EnvironmentId,
        string Name,
        string[]? Chains
    );

    public sealed class Validator : Validator<Request>
    {
        public Validator(ChainService chainService)
        {
            RuleFor(x => x.Name).ApplyNameValidation();

            RuleForEach(x => x.Chains)
                .Cascade(CascadeMode.Stop)
                .Must(static chain => !String.IsNullOrWhiteSpace(chain))
                .WithMessage(ChainValidation.REQUIRED_MESSAGE)
                .MaximumLength(30)
                .WithMessage(ChainValidation.LENGTH_MESSAGE)
                .Must(chainService.IsRegisteredChain)
                .WithMessage(ChainValidation.INVALID_MESSAGE);
        }
    }

    public override void Configure()
    {
        Put("/api/Applications/{ApplicationId}/Environments/{EnvironmentId}");
        Roles(AuthRoles.ADMIN);
    }

    public override async Task HandleAsync(Request req, CancellationToken ct)
    {
        var environment = await dbContext.ApplicationEnvironments
            .SingleOrDefaultAsync(environment => environment.ApplicationId == req.ApplicationId && environment.Id == req.EnvironmentId, ct);

        if(environment is null)
        {
            ThrowError("Environment not found.", 404);
        }

        if(await dbContext.ApplicationEnvironments.AnyAsync(existingEnvironment => existingEnvironment.ApplicationId == req.ApplicationId && existingEnvironment.Id != req.EnvironmentId && existingEnvironment.Name == req.Name, ct))
        {
            ThrowError("An environment with this name already exists.", 409);
        }

        environment.Name = req.Name;

        if(req.Chains is not null)
        {
            environment.Chains = [.. req.Chains.Distinct()];
        }

        try
        {
            await dbContext.SaveChangesAsync(ct);
        }
        catch(DbUpdateException ex) when(ex.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation })
        {
            ThrowError("An environment with this name already exists.", 409);
        }

        await Send.NoContentAsync(ct);
    }
}
