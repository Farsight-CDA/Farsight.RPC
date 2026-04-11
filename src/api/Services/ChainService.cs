using Farsight.Chains;
using Farsight.Common;
using Farsight.Common.Extensions;

namespace Farsight.Rpc.Api.Services;

public partial class ChainService : Singleton
{
    public ReadOnlyMemory<ChainMetadata> Chains { get; } = ChainRegistry.GetAllChains();

    public bool IsRegisteredChain(string chainName)
        => Chains.Any(x => x.Name.Equals(chainName, StringComparison.OrdinalIgnoreCase));
}
