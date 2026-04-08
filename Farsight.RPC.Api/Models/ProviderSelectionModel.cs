using Farsight.RPC.Types;

namespace Farsight.RPC.Api.Models;

public sealed class ProviderSelectionModel
{
    public Guid? ApplicationId { get; set; }

    public HostEnvironment Environment { get; set; } = HostEnvironment.Development;

    public Guid? ChainId { get; set; }
}
