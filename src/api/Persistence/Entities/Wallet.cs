namespace Farsight.Rpc.Api.Persistence.Entities;

public sealed class Wallet
{
    public required Guid Id { get; init; }
    public required string Name { get; set; }
    public required string Mnemonic { get; init; }
    public string Color { get; set; } = "#6B7280";

    //Navigation Property
    public List<WalletPrivateKey>? PrivateKeys { get; private set; }

    //Navigation Property
    public List<WalletPrivateKeyGroup>? PrivateKeyGroups { get; private set; }
}
