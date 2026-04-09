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
    }
}
