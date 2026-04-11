using Farsight.Rpc.Api.Auth;
using Farsight.Rpc.Api.Persistence;
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
