using Farsight.Rpc.Api.Persistence;
using Farsight.Rpc.Api.Persistence.Entities;
using FastEndpoints;

namespace Farsight.Rpc.Api.Endpoints.Admin.Applications;

public sealed class CreateApplicationEndpoint(RpcProvidersDbContext dbContext) : Endpoint<CreateApplicationEndpoint.Request>
{
    public sealed class Request
    {
        public string Name { get; set; } = String.Empty;
    }

    public override void Configure()
    {
        Post("/api/admin/applications");
        Policies(AuthorizationPolicies.ADMIN_ONLY);
    }

    public override async Task HandleAsync(Request req, CancellationToken ct)
    {
        if(String.IsNullOrWhiteSpace(req.Name))
        {
            await Send.ResultAsync(TypedResults.BadRequest(new { Message = "Application name is required." }));
            return;
        }

        dbContext.Applications.Add(new ApplicationEntity { Id = Guid.NewGuid(), Name = req.Name.Trim() });
        await dbContext.SaveChangesAsync(ct);
        await Send.NoContentAsync(ct);
    }
}
