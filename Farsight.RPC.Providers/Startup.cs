using Farsight.RPC.Providers.Data;
using Farsight.Common.Startup;
using Microsoft.EntityFrameworkCore;

namespace Farsight.RPC.Providers;

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
        var dbContextFactory = scope.ServiceProvider.GetRequiredService<IDbContextFactory<RpcProvidersDbContext>>();
        await using var dbContext = await dbContextFactory.CreateDbContextAsync(cancellationToken);
        await dbContext.Database.MigrateAsync(cancellationToken);
    }
}
