using Farsight.Rpc.Api.Auth;
using Farsight.Rpc.Api.Persistence;
using Farsight.Rpc.Api.Persistence.Entities;
using FastEndpoints;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace Farsight.Rpc.Api.Endpoints.Applications;

public sealed class POST(AppDbContext dbContext) : Endpoint<POST.Request, POST.Response>
{
    public sealed record Request(string Name);
    public new sealed record Response(Guid Id, string Name, int TracingCount, int RealtimeCount, int ArchiveCount);

    public sealed class Validator : AbstractValidator<Request>
    {
        public Validator()
        {
            RuleFor(x => x.Name)
                .Must(static name => !string.IsNullOrWhiteSpace(name))
                .WithMessage("Name is required.");

            RuleFor(x => x.Name)
                .Must(static name => name is null || name == name.Trim())
                .WithMessage("Name cannot have leading or trailing whitespace.");
        }
    }

    public override void Configure()
    {
        Post("/api/applications");
        Policies(AuthPolicies.ADMIN_ONLY);
    }

    public override async Task HandleAsync(Request req, CancellationToken ct)
    {
        if(await dbContext.ConsumerApplications.AnyAsync(a => a.Name == req.Name, ct))
            ThrowError("An application with this name already exists.", 409);

        var application = new ConsumerApplication
        {
            Id = Guid.NewGuid(),
            Name = req.Name,
        };

        dbContext.ConsumerApplications.Add(application);
        try
        {
            await dbContext.SaveChangesAsync(ct);
        }
        catch(DbUpdateException ex) when(ex.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation })
        {
            ThrowError("An application with this name already exists.", 409);
        }

        await Send.OkAsync(new Response(application.Id, application.Name, 0, 0, 0), ct);
    }
}
