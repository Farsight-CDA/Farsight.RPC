using Farsight.Rpc.Api.Auth;
using Farsight.Rpc.Api.Persistence;
using FastEndpoints;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace Farsight.Rpc.Api.Endpoints.Applications;

public sealed class PUT(AppDbContext dbContext) : Endpoint<PUT.Request, PUT.Response>
{
    public sealed class Request
    {
        [RouteParam]
        public Guid Id { get; init; }

        public string? Name { get; init; }
    }

    public new sealed record Response(Guid Id, string Name, int TracingCount, int RealtimeCount, int ArchiveCount);

    public sealed class Validator : AbstractValidator<Request>
    {
        public Validator()
        {
            RuleFor(x => x.Name)
                .Cascade(CascadeMode.Stop)
                .Must(static name => !String.IsNullOrWhiteSpace(name))
                .WithMessage("Name is required.")
                .Must(static name => name!.AsSpan().Trim().Length == name!.Length)
                .WithMessage("Name cannot have leading or trailing whitespace.");
        }
    }

    public override void Configure()
    {
        Put("/api/applications/{id}");
        Roles(AuthRoles.ADMIN);
    }

    public override async Task HandleAsync(Request req, CancellationToken ct)
    {
        var name = req.Name!;

        var application = await dbContext.ConsumerApplications
            .SingleOrDefaultAsync(a => a.Id == req.Id, ct);

        if(application is null)
        {
            ThrowError("Application not found.", 404);
        }

        if(await dbContext.ConsumerApplications.AnyAsync(a => a.Id != req.Id && a.Name == name, ct))
        {
            ThrowError("An application with this name already exists.", 409);
        }

        application.Name = name;

        try
        {
            await dbContext.SaveChangesAsync(ct);
        }
        catch(DbUpdateException ex) when(ex.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation })
        {
            ThrowError("An application with this name already exists.", 409);
        }

        var response = await dbContext.ConsumerApplications
            .AsNoTracking()
            .Where(a => a.Id == req.Id)
            .Select(a => new Response(
                a.Id,
                a.Name,
                a.TracingRpcs!.Count,
                a.RealtimeRpcs!.Count,
                a.ArchiveRpcs!.Count
            ))
            .SingleAsync(ct);

        await Send.OkAsync(response, ct);
    }
}
