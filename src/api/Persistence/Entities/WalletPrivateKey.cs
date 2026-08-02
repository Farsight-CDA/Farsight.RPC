namespace Farsight.Rpc.Api.Persistence.Entities;

public sealed class WalletPrivateKey
{
    public required Guid Id { get; init; }
    public required Guid WalletId { get; init; }
    public required WalletCurve Curve { get; init; }
    public required string DerivationPath { get; init; }

    //Navigation Property
    public Wallet? Wallet { get; private set; }

    //Navigation Property
    public List<WalletApiKey>? ApiKeys { get; private set; }
}
