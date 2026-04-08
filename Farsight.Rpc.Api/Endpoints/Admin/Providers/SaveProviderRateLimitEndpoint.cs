using Farsight.Rpc.Api.Persistence;
using Farsight.Rpc.Api.Persistence.Entities;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;

namespace Farsight.Rpc.Api.Endpoints.Admin.Providers;

public sealed class SaveProviderRateLimitEndpoint(RpcProvidersDbContext dbContext) : Endpoint<SaveProviderRateLimitEndpoint.Request>
{
    public sealed class Request
    {
        public Guid Id { get; set; }

        public int? RateLimit { get; set; }
    }

    public override void Configure()
    {
        Put("/api/admin/providers/{Id}/rate-limit");
        Policies(AuthorizationPolicies.ADMIN_ONLY);
    }

    public override async Task HandleAsync(Request req, CancellationToken ct)
    {
        var entity = await dbContext.ProviderRateLimits.SingleOrDefaultAsync(x => x.ProviderId == req.Id, ct);
        if(!req.RateLimit.HasValue)
        {
            if(entity is not null)
            {
                dbContext.ProviderRateLimits.Remove(entity);
                await dbContext.SaveChangesAsync(ct);
            }
            await Send.NoContentAsync(ct);
            return;
        }

        if(req.RateLimit.Value <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(req.RateLimit), "Rate limit must be greater than 0.");
        }

        if(entity is null)
        {
            dbContext.ProviderRateLimits.Add(new ProviderRateLimitEntity { ProviderId = req.Id, RateLimit = req.RateLimit.Value });
        }
        else
        {
            entity.RateLimit = req.RateLimit.Value;
        }
        await dbContext.SaveChangesAsync(ct);
        await Send.NoContentAsync(ct);
    }
}
