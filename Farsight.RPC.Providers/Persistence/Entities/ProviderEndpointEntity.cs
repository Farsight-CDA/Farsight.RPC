using Farsight.RPC.Providers.Contracts;

namespace Farsight.RPC.Providers.Persistence.Entities;

public abstract class ProviderEndpointEntity
{
    public Guid Id { get; set; }

    public HostEnvironment Environment { get; set; }

    public Guid ApplicationId { get; set; }

    public ApplicationEntity Application { get; set; } = null!;

    public Guid ChainId { get; set; }

    public ChainEntity Chain { get; set; } = null!;

    public Guid ProviderId { get; set; }

    public ProviderEntity Provider { get; set; } = null!;

    public Uri Address { get; set; } = null!;

    public DateTimeOffset UpdatedUtc { get; set; }

    public DateTimeOffset? ProbedUtc { get; set; }
}
