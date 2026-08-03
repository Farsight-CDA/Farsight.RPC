using EtherSharp.Crypto;
using EtherSharp.Types;
using EtherSharp.Wallet;
using Farsight.Rpc.Sdk.Client;

namespace Farsight.Rpc.Sdk.Evm;

/// <summary>
/// An EtherSharp signer backed by a Farsight wallet API key.
/// </summary>
public sealed class FarsightEtherSigner : IEtherSigner
{
    private readonly IFarsightRpcClient _client;
    private readonly string _apiKey;

    public Address Address { get; }

    private FarsightEtherSigner(IFarsightRpcClient client, string apiKey, Address address)
    {
        _client = client;
        _apiKey = apiKey;
        Address = address;
    }

    public static async Task<FarsightEtherSigner> CreateAsync(
        IFarsightRpcClient client,
        string apiKey,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(client);
        ArgumentException.ThrowIfNullOrWhiteSpace(apiKey);

        var result = await client.GetWalletInfoAsync(apiKey, cancellationToken);
        string address = result switch
        {
            IFarsightRpcClient.GetWalletInfoResult.Success success => success.Address,
            IFarsightRpcClient.GetWalletInfoResult.InvalidApiKey => throw new InvalidOperationException("The wallet API key was rejected."),
            _ => throw new InvalidOperationException("Unknown wallet information result."),
        };

        try
        {
            return new FarsightEtherSigner(client, apiKey, Address.Parse(address));
        }
        catch(Exception ex) when(ex is ArgumentException or FormatException)
        {
            throw new InvalidOperationException("The wallet API key is not associated with a compatible EVM private key.", ex);
        }
    }

    public async ValueTask<EtherSignature> SignAsync(Bytes32 hash, CancellationToken cancellationToken = default)
    {
        var signature = await SignRecoverableAsync(hash, cancellationToken);
        return new EtherSignature(signature.R, signature.S);
    }

    public async ValueTask<RecoverableEtherSignature> SignRecoverableAsync(Bytes32 hash, CancellationToken cancellationToken = default)
    {
        var result = await _client.SignAsync(_apiKey, hash.ToArray(), cancellationToken);
        byte[] signature = result switch
        {
            IFarsightRpcClient.SignResult.Success success => success.Signature,
            IFarsightRpcClient.SignResult.InvalidApiKey => throw new InvalidOperationException("The wallet API key was rejected."),
            IFarsightRpcClient.SignResult.InvalidData => throw new InvalidOperationException("The wallet API key is not associated with a compatible secp256k1 private key."),
            _ => throw new InvalidOperationException("Unknown wallet signing result."),
        };

        if(signature.Length != 65)
        {
            throw new InvalidOperationException("The wallet API returned an invalid secp256k1 signature.");
        }

        byte recoveryId = signature[64];
        if(recoveryId is not (0 or 1 or 27 or 28))
        {
            throw new InvalidOperationException("The wallet API returned an invalid secp256k1 recovery identifier.");
        }
        //
        return new RecoverableEtherSignature(
            Bytes32.FromBytes(signature.AsSpan(0, 32)),
            Bytes32.FromBytes(signature.AsSpan(32, 32)),
            recoveryId
        );
    }

    public ValueTask<RecoverableEtherSignature> SignEIP712Async<TMessage>(
        in EIP712Domain domain,
        in TMessage message,
        CancellationToken cancellationToken = default
    ) where TMessage : IEIP712Type
        => NormalizeEIP712SignatureAsync(
            SignRecoverableAsync(
                message.GetSigningHash(domain),
                cancellationToken
            )
        );

    private static async ValueTask<RecoverableEtherSignature> NormalizeEIP712SignatureAsync(
        ValueTask<RecoverableEtherSignature> signatureTask)
    {
        var signature = await signatureTask;
        byte recoveryId = signature.RecoveryId < 27
            ? (byte) (signature.RecoveryId + 27)
            : signature.RecoveryId;
        return new RecoverableEtherSignature(signature.R, signature.S, recoveryId);
    }
}
