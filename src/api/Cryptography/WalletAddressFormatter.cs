using EtherSharp.Crypto;
using EtherSharp.Types;
using Farsight.Rpc.Api.Persistence.Entities;

namespace Farsight.Rpc.Api.Cryptography;

internal static class WalletAddressFormatter
{
    public static string FormatAddress(WalletAddressFormat format, ReadOnlySpan<byte> publicKey)
        => format switch
        {
            WalletAddressFormat.Evm => FormatEvmAddress(publicKey),
            WalletAddressFormat.Solana => Base58Encoding.Encode(publicKey),
            _ => throw new InvalidOperationException($"Unsupported wallet address format '{format}'."),
        };

    private static string FormatEvmAddress(ReadOnlySpan<byte> publicKey)
    {
        Span<byte> hash = stackalloc byte[32];
        return !Keccak256.TryHashData(publicKey, hash)
            ? throw new InvalidOperationException("Failed to hash the EVM public key.")
            : Address.FromBytes(hash[^Address.BYTES_LENGTH..]).ToEIP55String();
    }
}
