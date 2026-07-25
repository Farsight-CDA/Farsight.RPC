using Farsight.Common;
using Farsight.Rpc.Api.Configuration;
using Farsight.Rpc.Api.Persistence.Entities;
using Fido2NetLib;
using Fido2NetLib.Objects;
using System.Security.Cryptography;
using System.Text;

namespace Farsight.Rpc.Api.Auth;

public sealed partial class SecurityKeyService : Singleton
{
    [Inject]
    private readonly SecurityKeyConfiguration _securityKeyConfiguration;

    private Fido2 CreateFido2()
        => new(new Fido2Configuration
        {
            ServerDomain = _securityKeyConfiguration.ServerDomain,
            ServerName = _securityKeyConfiguration.ServerName,
            Origins = _securityKeyConfiguration.Origins,
            BackupEligibleCredentialPolicy = Fido2Configuration.CredentialBackupPolicy.Disallowed,
            BackedUpCredentialPolicy = Fido2Configuration.CredentialBackupPolicy.Disallowed,
        });

    public CredentialCreateOptions CreateRegistrationOptions(string username, params ReadOnlySpan<UserSecurityKey> existingKeys)
    {
        var user = new Fido2User
        {
            Id = SHA256.HashData(Encoding.UTF8.GetBytes(username)),
            Name = username,
            DisplayName = username,
        };

        var options = CreateFido2().RequestNewCredential(new RequestNewCredentialParams
        {
            User = user,
            ExcludeCredentials = CreateCredentialDescriptors(existingKeys),
            AuthenticatorSelection = new AuthenticatorSelection
            {
                AuthenticatorAttachment = AuthenticatorAttachment.CrossPlatform,
                ResidentKey = ResidentKeyRequirement.Discouraged,
                UserVerification = UserVerificationRequirement.Preferred,
            },
            AttestationPreference = AttestationConveyancePreference.None,
        });
        options.Hints = [PublicKeyCredentialHint.SecurityKey];
        return options;
    }

    public AssertionOptions CreateAssertionOptions(params ReadOnlySpan<UserSecurityKey> keys)
        => CreateFido2().GetAssertionOptions(new GetAssertionOptionsParams
        {
            AllowedCredentials = CreateCredentialDescriptors(keys),
            UserVerification = UserVerificationRequirement.Discouraged,
        });

    private static PublicKeyCredentialDescriptor[] CreateCredentialDescriptors(ReadOnlySpan<UserSecurityKey> keys)
    {
        var descriptors = new PublicKeyCredentialDescriptor[keys.Length];
        for(int i = 0; i < keys.Length; i++)
        {
            descriptors[i] = new PublicKeyCredentialDescriptor(keys[i].CredentialId);
        }

        return descriptors;
    }

    public Task<RegisteredPublicKeyCredential> VerifyRegistrationAsync(
        AuthenticatorAttestationRawResponse response,
        CredentialCreateOptions options,
        IsCredentialIdUniqueToUserAsyncDelegate uniquenessCallback,
        CancellationToken cancellationToken)
        => CreateFido2().MakeNewCredentialAsync(new MakeNewCredentialParams
        {
            AttestationResponse = response,
            OriginalOptions = options,
            IsCredentialIdUniqueToUserCallback = uniquenessCallback,
        }, cancellationToken);

    public Task<VerifyAssertionResult> VerifyAssertionAsync(
        AuthenticatorAssertionRawResponse response,
        AssertionOptions options,
        UserSecurityKey key,
        CancellationToken cancellationToken)
        => CreateFido2().MakeAssertionAsync(new MakeAssertionParams
        {
            AssertionResponse = response,
            OriginalOptions = options,
            StoredPublicKey = key.PublicKey,
            StoredSignatureCounter = checked((uint) key.SignatureCounter),
            IsUserHandleOwnerOfCredentialIdCallback = (parameters, _) => Task.FromResult(
                parameters.CredentialId.AsSpan().SequenceEqual(key.CredentialId)
                && parameters.UserHandle.AsSpan().SequenceEqual(key.UserHandle)),
        }, cancellationToken);
}
