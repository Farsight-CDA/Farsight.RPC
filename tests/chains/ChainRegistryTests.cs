using Xunit;

namespace Farsight.Chains.Tests;

public sealed class ChainRegistryTests
{
    [Fact]
    public void GetAllChains_ShouldReturnChains()
        => Assert.NotEmpty(ChainRegistry.Chains);
}
