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
        Span<byte> privateKey = stackalloc byte[32];

        try
        {
            DerivePrivateKey(curve, mnemonic, derivationPath, privateKey);

            int publicKeyLength = curve switch
            {
                WalletCurve.Secp256k1 => Secp256k1.Instance.CompressedPublicKeyLength,
                WalletCurve.Ed25519 => ED25519.Instance.PublicKeyLength,
                _ => throw new InvalidOperationException($"Unsupported wallet curve '{curve}'."),
            };
            byte[] publicKey = new byte[publicKeyLength];

            switch(curve)
            {
                case WalletCurve.Secp256k1:
                    Secp256k1.Instance.MakeCompressedPublicKey(privateKey, publicKey);
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

    public static void DerivePrivateKey(
        WalletCurve curve,
        string mnemonic,
        string derivationPath,
        Span<byte> destination)
    {
        if(destination.Length != 32)
        {
            throw new ArgumentException("The private key destination must be 32 bytes.", nameof(destination));
        }

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
                WalletCurve.Secp256k1 => Slip10.TryDerivePath(Secp256k1.Instance, seed, destination, chainCode, derivationPath),
                WalletCurve.Ed25519 => Slip10.TryDerivePath(ED25519.Instance, seed, destination, chainCode, derivationPath),
                _ => throw new InvalidOperationException($"Unsupported wallet curve '{curve}'."),
            };

            if(!derived)
            {
                throw new InvalidOperationException($"Failed to derive the {curve} private key.");
            }
        }
        finally
        {
            CryptographicOperations.ZeroMemory(seed);
            CryptographicOperations.ZeroMemory(chainCode);
        }
    }
}
