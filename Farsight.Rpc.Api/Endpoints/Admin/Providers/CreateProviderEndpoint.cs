using Farsight.Rpc.Api.Models;
using Farsight.Rpc.Api.Persistence;
using Farsight.Rpc.Api.Persistence.Entities;
using Farsight.Rpc.Api.Services;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;

namespace Farsight.Rpc.Api.Endpoints.Admin.Providers;

public sealed class CreateProviderEndpoint(RpcProvidersDbContext dbContext) : Endpoint<CreateProviderEndpoint.Request>
{
    public sealed class Request
    {
        public string Name { get; set; } = String.Empty;

        public int? RateLimit { get; set; }
    }

    public override void Configure()
    {
        Post("/api/admin/providers");
        Policies(AuthorizationPolicies.ADMIN_ONLY);
    }

    public override async Task HandleAsync(Request req, CancellationToken ct)
    {
        string normalizedName = req.Name.Trim();
        if(String.IsNullOrWhiteSpace(normalizedName))
        {
            await Send.ResultAsync(TypedResults.Conflict(new ValidationErrorResponse("Provider name is invalid or already exists.")));
            return;
        }

        bool exists = await dbContext.Providers.AsNoTracking().AnyAsync(x => x.Name == normalizedName, ct);
        if(exists)
        {
            await Send.ResultAsync(TypedResults.Conflict(new ValidationErrorResponse("Provider name is invalid or already exists.")));
            return;
        }

        if(req.RateLimit.HasValue && req.RateLimit.Value <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(req.RateLimit), "Rate limit must be greater than 0.");
        }

        var provider = new ProviderEntity { Id = Guid.NewGuid(), Name = normalizedName };
        dbContext.Providers.Add(provider);
        if(req.RateLimit.HasValue)
        {
            dbContext.ProviderRateLimits.Add(new ProviderRateLimitEntity { ProviderId = provider.Id, RateLimit = req.RateLimit.Value });
        }

        await dbContext.SaveChangesAsync(ct);
        await Send.NoContentAsync(ct);
    }
}
