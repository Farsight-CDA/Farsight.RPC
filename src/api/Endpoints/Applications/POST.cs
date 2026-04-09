using Farsight.Rpc.Api.Auth;
using Farsight.Rpc.Api.Persistence;
using Farsight.Rpc.Api.Persistence.Entities;
using FastEndpoints;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace Farsight.Rpc.Api.Endpoints.Applications;

public sealed class POST(AppDbContext dbContext) : Endpoint<POST.Request>
{
    public sealed record Request(string Name);

    public sealed class Validator : AbstractValidator<Request>
    {
        public Validator()
        {
            RuleFor(x => x.Name)
                .Cascade(CascadeMode.Stop)
                .Must(static name => !String.IsNullOrWhiteSpace(name))
                .WithMessage(ApplicationNameValidation.REQUIRED_MESSAGE)
                .Must(static name => name.AsSpan().Trim().Length == name.Length)
                .WithMessage(ApplicationNameValidation.OUTER_WHITESPACE_MESSAGE)
                .Must(ApplicationNameValidation.HasAllowedCharacters)
                .WithMessage(ApplicationNameValidation.ALLOWED_CHARACTERS_MESSAGE);
        }
    }

    public override void Configure()
    {
        Post("/api/applications");
        Roles(AuthRoles.ADMIN);
    }

    public override async Task HandleAsync(Request req, CancellationToken ct)
    {
        if(ApplicationNameValidation.GetValidationError(req.Name) is { } validationError)
        {
            ThrowError(validationError);
        }

        if(await dbContext.ConsumerApplications.AnyAsync(a => a.Name == req.Name, ct))
        {
            ThrowError("An application with this name already exists.", 409);
        }

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

        await Send.NoContentAsync(ct);
    }
}
