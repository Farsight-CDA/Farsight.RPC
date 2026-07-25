using Fido2NetLib;

namespace Farsight.Rpc.Api.Persistence.Entities;

public abstract class SecurityKeyChallenge
{
    public required Guid Id { get; init; }
    public required string Username { get; init; }
    public required DateTimeOffset ExpiresAt { get; init; }

    public sealed class Login : SecurityKeyChallenge
    {
        public required AssertionOptions Options { get; init; }
    }

    public sealed class Registration : SecurityKeyChallenge
    {
        public required string KeyName { get; init; }
        public required CredentialCreateOptions Options { get; init; }
    }
}
