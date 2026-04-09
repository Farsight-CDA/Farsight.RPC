using Farsight.Rpc.Api.Auth;
using Farsight.Rpc.Api.Persistence;
using FastEndpoints;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace Farsight.Rpc.Api.Endpoints.Applications;

public sealed class PUT(AppDbContext dbContext) : Endpoint<PUT.Request>
{
    public sealed class Request
    {
        [RouteParam]
        public Guid Id { get; init; }

        public required string Name { get; init; }
    }

    public sealed class Validator : AbstractValidator<Request>
    {
        public Validator()
        {
            RuleFor(x => x.Name)
                .Cascade(CascadeMode.Stop)
                .Must(static name => !String.IsNullOrWhiteSpace(name))
                .WithMessage(ApplicationNameValidation.REQUIRED_MESSAGE)
                .Must(static name => name!.AsSpan().Trim().Length == name!.Length)
                .WithMessage(ApplicationNameValidation.OUTER_WHITESPACE_MESSAGE)
                .Must(ApplicationNameValidation.HasAllowedCharacters)
                .WithMessage(ApplicationNameValidation.ALLOWED_CHARACTERS_MESSAGE);
        }
    }

    public override void Configure()
    {
        Put("/api/applications/{id}");
        Roles(AuthRoles.ADMIN);
    }

    public override async Task HandleAsync(Request req, CancellationToken ct)
    {
        if(ApplicationNameValidation.GetValidationError(req.Name) is { } validationError)
        {
            ThrowError(validationError);
        }

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
