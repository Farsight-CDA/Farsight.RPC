using Xunit;

namespace Farsight.Chains.Tests;

public sealed class ChainRegistryTests
{
    [Fact]
    public void GetAllChains_ShouldReturnChains()
    {
        var chains = ChainRegistry.GetAllChains();
        Assert.NotEmpty(chains);
    }
}
