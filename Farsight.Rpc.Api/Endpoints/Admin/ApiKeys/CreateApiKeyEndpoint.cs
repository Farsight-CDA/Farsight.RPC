using Farsight.Rpc.Api.Models;
using Farsight.Rpc.Api.Persistence;
using Farsight.Rpc.Api.Persistence.Entities;
using Farsight.Rpc.Api.Services;
using Farsight.Rpc.Types;
using FastEndpoints;

namespace Farsight.Rpc.Api.Endpoints.Admin.ApiKeys;

public sealed class CreateApiKeyEndpoint(RpcProvidersDbContext dbContext) : Endpoint<CreateApiKeyEndpoint.Request, ApiClientCreateResult>
{
    public sealed class Request
    {
        public Guid ApplicationId { get; set; }

        public HostEnvironment Environment { get; set; }
    }

    public override void Configure()
    {
        Post("/api/admin/api-keys");
        Policies(AuthorizationPolicies.ADMIN_ONLY);
    }

    public override async Task HandleAsync(Request req, CancellationToken ct)
    {
        if(req.ApplicationId == Guid.Empty)
        {
            await Send.ResultAsync(TypedResults.BadRequest(new { Message = "ApplicationId is required." }));
            return;
        }

        var now = DateTimeOffset.UtcNow;
        string apiKey = AdminEndpointDbHelpers.GenerateApiKey();
        var client = new ApiClientEntity
        {
            Id = Guid.NewGuid(),
            ApiKey = apiKey,
            ApplicationId = req.ApplicationId,
            Environment = req.Environment,
            IsEnabled = true,
            CreatedUtc = now,
            UpdatedUtc = now
        };
        dbContext.ApiClients.Add(client);
        await dbContext.SaveChangesAsync(ct);

        await Send.OkAsync(new ApiClientCreateResult(client.Id, apiKey), ct);
    }
}
