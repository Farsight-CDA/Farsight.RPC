using Farsight.Chains;
using Farsight.Common.Startup;
using Farsight.Rpc.Api.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Farsight.Rpc.Api;

public partial class Startup : FarsightStartup
{
    public override Task StartingAsync(CancellationToken cancellationToken)
        => SetupServicesAsync(cancellationToken);

    public override async Task StartAsync(CancellationToken cancellationToken)
    {
        await MigrateDatabaseAsync(cancellationToken);
        await InitializeServicesAsync(cancellationToken);
    }

    public override Task StartedAsync(CancellationToken cancellationToken)
        => RunServicesAsync(_lifetime.ApplicationStopping);

    private async Task MigrateDatabaseAsync(CancellationToken cancellationToken)
    {
        await using var scope = _provider.CreateAsyncScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await dbContext.Database.MigrateAsync(cancellationToken);
        await CleanupDeprecatedChainsAsync(dbContext, cancellationToken);
    }

    private async Task CleanupDeprecatedChainsAsync(AppDbContext dbContext, CancellationToken cancellationToken)
    {
        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);

        string[] registeredChains = [.. ChainRegistry.Chains.Select(chain => chain.Name.ToLowerInvariant())];

        int deletedRpcs = await dbContext.Rpcs
            .Where(rpc => !registeredChains.Contains(rpc.Chain.ToLower()))
            .ExecuteDeleteAsync(cancellationToken);

        var environments = await dbContext.ApplicationEnvironments.ToArrayAsync(cancellationToken);

        foreach(var environment in environments)
        {
            string[] chains = [.. environment.Chains.Where(ChainRegistry.IsRegisteredChain)];

            if(chains.Length != environment.Chains.Length)
            {
                environment.Chains = chains;
            }
        }

        var rules = await dbContext.RpcRules
            .Where(rule => rule.Chains.Length > 0)
            .ToArrayAsync(cancellationToken);

        foreach(var rule in rules)
        {
            string[] chains = [.. rule.Chains.Where(ChainRegistry.IsRegisteredChain)];

            if(chains.Length == rule.Chains.Length)
            {
                continue;
            }

            if(chains.Length == 0)
            {
                dbContext.RpcRules.Remove(rule);
            }
            else
            {
                rule.Chains = chains;
            }
        }

        int updatedConfigurations = await dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        _logger.LogInformation(
            "Deprecated chain cleanup deleted {DeletedRpcCount} RPC endpoints and updated or deleted {ConfigurationCount} environment and rule entries",
            deletedRpcs,
            updatedConfigurations);
    }
}
