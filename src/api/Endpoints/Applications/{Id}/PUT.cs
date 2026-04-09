using Farsight.Rpc.Api.Auth;
using Farsight.Rpc.Api.Persistence;
using Farsight.Rpc.Api.Validation;
using FastEndpoints;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace Farsight.Rpc.Api.Endpoints.Applications;

public sealed class PUT(AppDbContext dbContext) : Endpoint<PUT.Request>
{
    public sealed record Request(
        [property: RouteParam] Guid Id,
        string Name
    );

    public sealed class Validator : AbstractValidator<Request>
    {
        public Validator()
        {
            RuleFor(x => x.Name).ApplyNameValidation();
        }
    }

    public override void Configure()
    {
        Put("/api/Applications/{Id}");
        Roles(AuthRoles.ADMIN);
    }

    public override async Task HandleAsync(Request req, CancellationToken ct)
    {
        var application = await dbContext.ConsumerApplications
            .SingleOrDefaultAsync(a => a.Id == req.Id, ct);

        if(application is null)
        {
            ThrowError("Application not found.", 404);
        }

        if(await dbContext.ConsumerApplications.AnyAsync(a => a.Id != req.Id && a.Name == req.Name, ct))
        {
            ThrowError("An application with this name already exists.", 409);
        }

        application.Name = req.Name;

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
