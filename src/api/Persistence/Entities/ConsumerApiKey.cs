namespace Farsight.Rpc.Api.Persistence.Entities;

public sealed class ConsumerApiKey
{
    public required Guid Id { get; init; }
    public required Guid EnvironmentId { get; init; }

    public required Guid ApplicationId { get; init; }

    public required string Key { get; init; }
    public DateTimeOffset? LastUsedAt { get; set; }

    //Navigation Property
    public ConsumerApplication? Application { get; private set; }

    //Navigation Property
    public ApplicationEnvironment? Environment { get; private set; }
}
