using Farsight.Common;
using Microsoft.EntityFrameworkCore;

namespace Farsight.RPC.Providers.Persistence;

public partial class DbInitializer : Singleton
{
    [Inject] private readonly IDbContextFactory<RpcProvidersDbContext> _dbContextFactory;

    protected override async Task InitializeAsync(CancellationToken cancellationToken)
    {
        await using var dbContext = await _dbContextFactory.CreateDbContextAsync(cancellationToken);
        await dbContext.Database.MigrateAsync(cancellationToken);
    }
}
