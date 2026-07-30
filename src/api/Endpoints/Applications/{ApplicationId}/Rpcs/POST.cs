using Farsight.Rpc.Api.Auth;
using Farsight.Rpc.Api.Persistence;
using Farsight.Rpc.Api.Persistence.Entities.Rpc;
using Farsight.Rpc.Api.Validation;
using Farsight.Rpc.Types;
using FastEndpoints;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace Farsight.Rpc.Api.Endpoints.Applications.Rpcs;

public sealed class POST(AppDbContext dbContext) : Endpoint<POST.Request>
{
    public sealed record Request(
        [property: RouteParam] Guid ApplicationId,
        Guid EnvironmentId,
        string Chain,
        Uri Address,
        Guid ProviderId,
        RpcCapability[] Capabilities,
        ulong EthGetLogsLimit,
        int Order
    );

    public sealed class Validator : Validator<Request>
    {
        public Validator()
        {
            RuleFor(x => x.EnvironmentId)
                .NotEmpty()
                .WithMessage("Environment is required.");

            RuleFor(x => x.Chain)
                .ApplyChainValidation();

            RuleFor(x => x.Address)
                .ApplyRpcAddressValidation();

            RuleFor(x => x.ProviderId)
                .NotEmpty()
                .WithMessage("Provider is required.");

            RuleFor(x => x.Capabilities)
                .NotNull()
                .WithMessage("Capabilities are required.")
                .Must(static capabilities => capabilities is null || capabilities.Distinct().Count() == capabilities.Length)
                .WithMessage("Capabilities must not contain duplicates.");

            RuleForEach(x => x.Capabilities)
                .IsInEnum()
                .WithMessage("Capability is invalid.");

            RuleFor(x => x.EthGetLogsLimit)
                .GreaterThan(0UL)
                .WithMessage("eth_getLogs limit must be greater than zero.");

            RuleFor(x => x.Order)
                .GreaterThanOrEqualTo(0)
                .WithMessage("Order must be greater than or equal to zero.");
        }
    }

    public override void Configure()
    {
        Post("/api/Applications/{ApplicationId}/Rpcs");
        Roles(AuthRoles.ADMIN);
    }

    public override async Task HandleAsync(Request req, CancellationToken ct)
    {
        var validation = await dbContext.ConsumerApplications
            .AsNoTracking()
            .Where(application => application.Id == req.ApplicationId)
            .Select(_ => new
            {
                EnvironmentExists = dbContext.ApplicationEnvironments.Any(environment =>
                    environment.ApplicationId == req.ApplicationId &&
                    environment.Id == req.EnvironmentId),
                ChainEnabled = dbContext.ApplicationEnvironments.Any(environment =>
                    environment.ApplicationId == req.ApplicationId &&
                    environment.Id == req.EnvironmentId &&
                    environment.Chains.Contains(req.Chain)),
                ProviderExists = dbContext.RpcProviders.Any(provider => provider.Id == req.ProviderId),
                RpcConflict = dbContext.Rpcs.Any(rpc =>
                    rpc.ApplicationId == req.ApplicationId &&
                    rpc.EnvironmentId == req.EnvironmentId &&
                    rpc.Chain == req.Chain &&
                    (rpc.Address == req.Address || rpc.Order == req.Order)),
            })
            .SingleOrDefaultAsync(ct);

        if(validation is null)
        {
            ThrowError("Application not found.", 404);
        }

        if(!validation.EnvironmentExists)
        {
            ThrowError("Environment not found.", 404);
        }

        if(!validation.ChainEnabled)
        {
            ThrowError("Chain is not enabled for this environment.");
        }

        if(!validation.ProviderExists)
        {
            ThrowError("RPC provider not found.", 404);
        }

        if(validation.RpcConflict)
        {
            ThrowError("RPC endpoint or order conflicts with an existing RPC for this chain and environment.", 409);
        }

        dbContext.Rpcs.Add(new RpcEndpoint
        {
            Id = Guid.NewGuid(),
            ApplicationId = req.ApplicationId,
            EnvironmentId = req.EnvironmentId,
            Chain = req.Chain,
            Address = req.Address,
            ProviderId = req.ProviderId,
            Capabilities = req.Capabilities,
            EthGetLogsLimit = req.EthGetLogsLimit,
            Order = req.Order,
        });

        try
        {
            await dbContext.SaveChangesAsync(ct);
        }
        catch(DbUpdateException ex) when(ex.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation })
        {
            ThrowError("RPC endpoint or order conflicts with an existing RPC for this chain and environment.", 409);
        }

        await Send.NoContentAsync(ct);
    }
}
