namespace Farsight.Rpc.Api.Persistence.Entities;

public sealed class WalletPrivateKeyGroup
{
    public required Guid Id { get; init; }
    public required Guid WalletId { get; init; }
    public required string Name { get; set; }
    public required string Description { get; set; }

    //Navigation Property
    public Wallet? Wallet { get; private set; }

    //Navigation Property
    public List<WalletPrivateKey>? PrivateKeys { get; private set; }
}
