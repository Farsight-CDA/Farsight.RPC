using Farsight.Rpc.Types;

namespace Farsight.Rpc.Api.Persistence.Entities;

public sealed class ConsumerApiKey
{
    public required Guid Id { get; init; }
    public required HostEnvironment Environment { get; init; }

    public required Guid ApplicationId { get; init; }
    //Navigation Property
    public ConsumerApplication? Application { get; private set; }

    public required string Key { get; init; }
    public DateTimeOffset? LastUsedAt { get; set; }
}
