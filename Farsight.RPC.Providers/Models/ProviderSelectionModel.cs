using Farsight.RPC.Providers.Contracts;

namespace Farsight.RPC.Providers.Models;

public sealed class ProviderSelectionModel
{
    public Guid? ApplicationId { get; set; }

    public HostEnvironment Environment { get; set; } = HostEnvironment.Development;

    public Guid? ChainId { get; set; }
}
