using Farsight.Rpc.Api.Models;
using Farsight.Rpc.Api.Persistence;
using Farsight.Rpc.Api.Persistence.Entities;
using Farsight.Rpc.Api.Services;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;

namespace Farsight.Rpc.Api.Endpoints.Admin.Chains;

public sealed class CreateChainEndpoint(RpcProvidersDbContext dbContext) : Endpoint<CreateChainEndpoint.Request>
{
    public sealed class Request
    {
        public string Name { get; set; } = String.Empty;
    }

    public override void Configure()
    {
        Post("/api/admin/chains");
        Policies(AuthorizationPolicies.ADMIN_ONLY);
    }

    public override async Task HandleAsync(Request req, CancellationToken ct)
    {
        string normalizedName = req.Name.Trim().ToLowerInvariant();
        if(String.IsNullOrWhiteSpace(normalizedName))
        {
            await Send.ResultAsync(TypedResults.Conflict(new ValidationErrorResponse("Chain name is invalid or already exists.")));
            return;
        }

        bool exists = await dbContext.Chains.AsNoTracking().AnyAsync(x => x.Name == normalizedName, ct);
        if(exists)
        {
            await Send.ResultAsync(TypedResults.Conflict(new ValidationErrorResponse("Chain name is invalid or already exists.")));
            return;
        }

        dbContext.Chains.Add(new ChainEntity { Id = Guid.NewGuid(), Name = normalizedName });
        await dbContext.SaveChangesAsync(ct);
        await Send.NoContentAsync(ct);
    }
}
