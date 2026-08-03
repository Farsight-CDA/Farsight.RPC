using EtherSharp.Crypto;
using EtherSharp.Types;
using Farsight.Rpc.Api.Persistence.Entities;

namespace Farsight.Rpc.Api.Cryptography;

internal static class WalletAddressFormatter
{
    public static WalletCurve GetCurve(WalletAddressFormat format)
        => format switch
        {
            WalletAddressFormat.Evm => WalletCurve.Secp256k1,
            WalletAddressFormat.Solana => WalletCurve.Ed25519,
            _ => throw new InvalidOperationException($"Unsupported wallet address format '{format}'."),
        };

    public static string FormatAddress(WalletAddressFormat format, ReadOnlySpan<byte> publicKey)
        => format switch
        {
            WalletAddressFormat.Evm => FormatEvmAddress(publicKey),
            WalletAddressFormat.Solana => FormatSolanaAddress(publicKey),
            _ => throw new InvalidOperationException($"Unsupported wallet address format '{format}'."),
        };

    private static string FormatEvmAddress(ReadOnlySpan<byte> publicKey)
    {
        if(publicKey.Length != 64)
        {
            throw new ArgumentException("An EVM public key must contain the 64-byte secp256k1 point.", nameof(publicKey));
        }

        Span<byte> hash = stackalloc byte[32];
        return !Keccak256.TryHashData(publicKey, hash)
            ? throw new InvalidOperationException("Failed to hash the EVM public key.")
            : Address.FromBytes(hash[^Address.BYTES_LENGTH..]).ToEIP55String();
    }

    private static string FormatSolanaAddress(ReadOnlySpan<byte> publicKey)
        => publicKey.Length != 32
            ? throw new ArgumentException("A Solana public key must be 32 bytes.", nameof(publicKey))
            : Base58Encoding.Encode(publicKey);
}
