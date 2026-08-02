namespace Farsight.Rpc.Api.Persistence.Entities;

public sealed class WalletApiKey
{
    public required Guid Id { get; init; }
    public required Guid WalletPrivateKeyId { get; init; }
    public required string Name { get; set; }
    public required string Key { get; init; }
    public DateTimeOffset? LastUsedAt { get; set; }

    //Navigation Property
    public WalletPrivateKey? WalletPrivateKey { get; private set; }
}
