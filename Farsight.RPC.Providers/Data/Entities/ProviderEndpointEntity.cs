using Farsight.RPC.Providers.Contracts;

namespace Farsight.RPC.Providers.Data.Entities;

public abstract class ProviderEndpointEntity
{
    public Guid Id { get; set; }

    public HostEnvironment Environment { get; set; }

    public string Application { get; set; } = string.Empty;

    public string Chain { get; set; } = string.Empty;

    public string Provider { get; set; } = string.Empty;

    public Uri Address { get; set; } = null!;

    public int Priority { get; set; }

    public bool IsEnabled { get; set; } = true;

    public DateTimeOffset CreatedUtc { get; set; }

    public DateTimeOffset UpdatedUtc { get; set; }
}
