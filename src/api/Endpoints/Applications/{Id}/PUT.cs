using Farsight.Rpc.Api.Auth;
using Farsight.Rpc.Api.Common.Extensions;
using Farsight.Rpc.Api.Persistence;
using FastEndpoints;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace Farsight.Rpc.Api.Endpoints.Applications;

public sealed class PUT(AppDbContext dbContext) : Endpoint<PUT.Request>
{
    public sealed record Request(
        [property: RouteParam] Guid ApplicationId,
        string? Name,
        string? Color
    );

    public sealed class Validator : Validator<Request>
    {
        public Validator()
        {
            When(
                x => x.Name is not null,
                () => RuleFor(x => x.Name!).ApplyNameValidation()
            );

            When(
                x => x.Color is not null,
                () => RuleFor(x => x.Color).ApplyColorValidation()
                );
        }
    }

    public override void Configure()
    {
        Put("/api/Applications/{ApplicationId}");
        Roles(AuthRoles.ADMIN);
    }

    public override async Task HandleAsync(Request req, CancellationToken ct)
    {
        var application = await dbContext.ConsumerApplications
            .SingleOrDefaultAsync(a => a.Id == req.ApplicationId, ct);

        if(application is null)
        {
            ThrowError("Application not found.", 404);
        }

        if(req.Name is not null)
        {
            application.Name = req.Name;
        }

        if(req.Color is not null)
        {
            application.Color = req.Color;
        }

        try
        {
            await dbContext.SaveChangesAsync(ct);
        }
        catch(DbUpdateException ex) when(ex.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation })
        {
            ThrowError("An application with this name already exists.", 409);
        }
        await Send.NoContentAsync(ct);
    }
}
