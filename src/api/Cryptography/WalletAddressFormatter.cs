using EtherSharp.Crypto;
using EtherSharp.Types;
using Farsight.Rpc.Api.Persistence.Entities;
using System.Security.Cryptography;

namespace Farsight.Rpc.Api.Cryptography;

internal static class WalletAddressFormatter
{
    private const string COSMOS_PREFIX = "cosmos";

    public static string FormatAddress(WalletAddressFormat format, ReadOnlySpan<byte> publicKey)
        => format switch
        {
            WalletAddressFormat.Evm => FormatEvmAddress(publicKey),
            WalletAddressFormat.Solana => Base58Encoding.Encode(publicKey),
            WalletAddressFormat.Cosmos => FormatCosmosAddress(publicKey),
            _ => throw new InvalidOperationException($"Unsupported wallet address format '{format}'."),
        };

    private static string FormatEvmAddress(ReadOnlySpan<byte> publicKey)
    {
        Span<byte> hash = stackalloc byte[32];
        return !Keccak256.TryHashData(publicKey, hash)
            ? throw new InvalidOperationException("Failed to hash the EVM public key.")
            : Address.FromBytes(hash[^Address.BYTES_LENGTH..]).ToEIP55String();
    }

    private static string FormatCosmosAddress(ReadOnlySpan<byte> publicKey)
    {
        if(publicKey.Length != 64)
        {
            throw new ArgumentException("Cosmos formatting requires a Secp256k1 public key.", nameof(publicKey));
        }

        Span<byte> compressedPublicKey = stackalloc byte[33];
        compressedPublicKey[0] = (publicKey[^1] & 1) == 0 ? (byte) 0x02 : (byte) 0x03;
        publicKey[..32].CopyTo(compressedPublicKey[1..]);

        Span<byte> publicKeyHash = stackalloc byte[32];
        _ = SHA256.HashData(compressedPublicKey, publicKeyHash);
        Span<byte> addressBytes = stackalloc byte[Ripemd160.HASH_LENGTH];
        Ripemd160.Hash32(publicKeyHash, addressBytes);

        return Bech32Encoding.Encode(COSMOS_PREFIX, addressBytes);
    }
}
