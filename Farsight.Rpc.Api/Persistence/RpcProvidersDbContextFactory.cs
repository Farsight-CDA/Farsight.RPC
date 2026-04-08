using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace Farsight.Rpc.Api.Persistence;

public sealed class RpcProvidersDbContextFactory : IDesignTimeDbContextFactory<RpcProvidersDbContext>
{
    public RpcProvidersDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<RpcProvidersDbContext>();
        optionsBuilder.UseNpgsql("Host=localhost;Database=farsight_rpc;Username=postgres;Password=postgres");
        return new RpcProvidersDbContext(optionsBuilder.Options);
    }
}
