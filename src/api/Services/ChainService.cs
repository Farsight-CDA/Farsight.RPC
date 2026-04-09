using Farsight.Chains;
using Farsight.Common;

namespace Farsight.Rpc.Api.Services;

public partial class ChainService : Singleton
{
    private string[]? _chainNames;

    protected override Task SetupAsync(CancellationToken cancellationToken)
    {
        _chainNames = [.. ChainRegistry.GetAllChains().Select(x => x.Name)];
        return Task.CompletedTask;
    }

    public ReadOnlyMemory<string> GetAllChainNames()
        => _chainNames is null
            ? throw new InvalidOperationException("ChainService has not been initialized. Call SetupAsync first.")
            : _chainNames;
}
