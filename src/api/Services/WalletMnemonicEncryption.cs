using Farsight.Common;
using Farsight.Rpc.Api.Configuration;
using System.Security.Cryptography;
using System.Text;

namespace Farsight.Rpc.Api.Services;

public sealed partial class WalletMnemonicEncryption : Singleton, IDisposable
{
    private const int NONCE_SIZE = 12;
    private const int TAG_SIZE = 16;
    private const int HEADER_SIZE = NONCE_SIZE + TAG_SIZE;

    [Inject]
    private readonly WalletEncryptionConfiguration _configuration;

    // The singleton's cipher is shared by concurrent requests.
    private readonly Lock _cipherLock = new Lock();
    private AesGcm? _cipher;

    private AesGcm Cipher
        => _cipher ?? throw new InvalidOperationException("Wallet mnemonic encryption is not available.");

    protected override Task SetupAsync(CancellationToken cancellationToken)
    {
        byte[] key = _configuration.DecodeKey();
        try
        {
            lock(_cipherLock)
            {
                _cipher = new AesGcm(key.AsSpan(), TAG_SIZE);
            }
        }
        finally
        {
            CryptographicOperations.ZeroMemory(key);
        }

        return Task.CompletedTask;
    }

    public byte[] Encrypt(string mnemonic)
    {
        byte[] plaintext = Encoding.UTF8.GetBytes(mnemonic);
        try
        {
            // Format: nonce | authentication tag | ciphertext.
            byte[] encrypted = new byte[HEADER_SIZE + plaintext.Length];
            var nonce = encrypted.AsSpan(0, NONCE_SIZE);
            RandomNumberGenerator.Fill(nonce);
            lock(_cipherLock)
            {
                Cipher.Encrypt(nonce, plaintext, encrypted.AsSpan(HEADER_SIZE), encrypted.AsSpan(NONCE_SIZE, TAG_SIZE));
            }

            return encrypted;
        }
        finally
        {
            CryptographicOperations.ZeroMemory(plaintext);
        }
    }

    public string Decrypt(ReadOnlySpan<byte> encrypted)
    {
        var ciphertext = encrypted[HEADER_SIZE..];
        byte[] plaintext = new byte[ciphertext.Length];
        try
        {
            lock(_cipherLock)
            {
                Cipher.Decrypt(encrypted[..NONCE_SIZE], ciphertext, encrypted.Slice(NONCE_SIZE, TAG_SIZE), plaintext);
            }

            return Encoding.UTF8.GetString(plaintext);
        }
        finally
        {
            CryptographicOperations.ZeroMemory(plaintext);
        }
    }

    public void Dispose()
    {
        lock(_cipherLock)
        {
            _cipher?.Dispose();
            _cipher = null;
        }
    }
}
