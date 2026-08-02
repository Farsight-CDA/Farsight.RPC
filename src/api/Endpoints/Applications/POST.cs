using Farsight.Rpc.Api.Auth;
using Farsight.Rpc.Api.Common.Extensions;
using Farsight.Rpc.Api.Persistence;
using Farsight.Rpc.Api.Persistence.Entities;
using FastEndpoints;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace Farsight.Rpc.Api.Endpoints.Applications;

public sealed class POST(AppDbContext dbContext) : Endpoint<POST.Request, POST.Response>
{
    public sealed record Request(
        string Name,
        string Color
    );

    public sealed class Validator : Validator<Request>
    {
        public Validator()
        {
            RuleFor(x => x.Name).ApplyNameValidation();
            RuleFor(x => x.Color).ApplyColorValidation();
        }
    }

    public new sealed record Response(
        Guid Id,
        string Name,
        string Color
    );

    public override void Configure()
    {
        Post("/api/Applications");
        Roles(AuthRoles.ADMIN);
    }

    public override async Task HandleAsync(Request req, CancellationToken ct)
    {
        var application = new ConsumerApplication
        {
            Id = Guid.NewGuid(),
            Name = req.Name,
            Color = req.Color,
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

        await Send.OkAsync(new Response(application.Id, application.Name, application.Color), ct);
    }
}
