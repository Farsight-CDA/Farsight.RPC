using Farsight.Rpc.Api.Persistence.Entities;
using Keysmith.Net.BIP;
using Keysmith.Net.EC;
using Keysmith.Net.ED;
using Keysmith.Net.SLIP;
using System.Security.Cryptography;

namespace Farsight.Rpc.Api.Cryptography;

internal static class WalletKeyDerivation
{
    public static byte[] DerivePublicKey(WalletCurve curve, string mnemonic, string derivationPath)
    {
        byte[] privateKey = DerivePrivateKey(curve, mnemonic, derivationPath);

        try
        {
            int publicKeyLength = curve switch
            {
                WalletCurve.Secp256k1 => Secp256k1.Instance.UncompressedPublicKeyLength,
                WalletCurve.Ed25519 => ED25519.Instance.PublicKeyLength,
                _ => throw new InvalidOperationException($"Unsupported wallet curve '{curve}'."),
            };
            byte[] publicKey = new byte[publicKeyLength];

            switch(curve)
            {
                case WalletCurve.Secp256k1:
                    Secp256k1.Instance.MakeUncompressedPublicKey(privateKey, publicKey);
                    // Keysmith exposes the native little-endian coordinates; store canonical big-endian X || Y.
                    publicKey.AsSpan(..32).Reverse();
                    publicKey.AsSpan(32..).Reverse();
                    break;
                case WalletCurve.Ed25519:
                    ED25519.Instance.MakePublicKey(privateKey, publicKey);
                    break;
            }

            return publicKey;
        }
        finally
        {
            CryptographicOperations.ZeroMemory(privateKey);
        }
    }

    public static byte[] DerivePrivateKey(
        WalletCurve curve,
        string mnemonic,
        string derivationPath)
    {
        byte[] privateKey = new byte[32];
        Span<byte> seed = stackalloc byte[64];
        Span<byte> chainCode = stackalloc byte[32];

        try
        {
            if(!BIP39.TryMnemonicToSeed(seed, mnemonic))
            {
                throw new InvalidOperationException("Failed to derive the wallet seed.");
            }

            bool derived = curve switch
            {
                WalletCurve.Secp256k1 => Slip10.TryDerivePath(Secp256k1.Instance, seed, privateKey, chainCode, derivationPath),
                WalletCurve.Ed25519 => Slip10.TryDerivePath(ED25519.Instance, seed, privateKey, chainCode, derivationPath),
                _ => throw new InvalidOperationException($"Unsupported wallet curve '{curve}'."),
            };

            return derived
                ? privateKey
                : throw new InvalidOperationException($"Failed to derive the {curve} private key.");
        }
        catch
        {
            CryptographicOperations.ZeroMemory(privateKey);
            throw;
        }
        finally
        {
            CryptographicOperations.ZeroMemory(seed);
            CryptographicOperations.ZeroMemory(chainCode);
        }
    }
}
