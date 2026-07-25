namespace Farsight.Rpc.Api.Persistence.Entities;

public sealed class UserSecurityKey
{
    public required Guid Id { get; init; }
    public required string Username { get; init; }
    public required string Name { get; init; }
    public required byte[] CredentialId { get; init; }
    public required byte[] PublicKey { get; init; }
    public required byte[] UserHandle { get; init; }
    public required long SignatureCounter { get; set; }
    public required Guid AaGuid { get; init; }
    public required DateTimeOffset CreatedAt { get; init; }
    public DateTimeOffset? LastUsedAt { get; set; }
}
