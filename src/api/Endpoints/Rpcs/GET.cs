using Farsight.Rpc.Api.Persistence;
using Farsight.Rpc.Api.Persistence.Entities.Rpc;
using Farsight.Rpc.Types;
using FastEndpoints;
using FluentValidation;
using Microsoft.EntityFrameworkCore;

namespace Farsight.Rpc.Api.Endpoints.Rpcs;

public sealed class GET(AppDbContext dbContext) : Endpoint<GET.Request, RpcEndpoint[]>
{
    public sealed record Request(
        [property: FromHeader(ApiKeyHeaders.API_KEY)] string ApiKey
    );

    public sealed class Validator : AbstractValidator<Request>
    {
        public Validator()
        {
            RuleFor(x => x.ApiKey)
                .NotNull()
                .WithMessage("API key is required.");
        }
    }

    public override void Configure()
    {
        Get("/api/Rpcs");
        AllowAnonymous();
    }

    public override async Task HandleAsync(Request req, CancellationToken ct)
    {
        var key = await dbContext.ConsumerApiKeys
            .AsNoTracking()
            .Where(k => k.Key == req.ApiKey)
            .Select(k => new
            {
                k.ApplicationId,
                k.Environment,
            })
            .SingleOrDefaultAsync(ct);

        if(key is null)
        {
            ThrowError("API key not found.", 404);
        }

        var rpcs = await dbContext.Rpcs
            .AsNoTracking()
            .Where(rpc => rpc.ApplicationId == key!.ApplicationId && rpc.Environment == key.Environment)
            .OrderBy(rpc => rpc.Chain)
            .ThenBy(rpc => EF.Property<string>(rpc, "RpcType"))
            .ThenBy(rpc => rpc.Id)
            .ToArrayAsync(ct);

        await Send.OkAsync(rpcs, ct);
    }
}
