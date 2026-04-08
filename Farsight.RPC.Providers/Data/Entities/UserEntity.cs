namespace Farsight.RPC.Providers.Data.Entities;

public sealed class UserEntity
{
    public Guid Id { get; set; }

    public string UserName { get; set; } = String.Empty;

    public string PasswordHash { get; set; } = String.Empty;

    public bool IsEnabled { get; set; } = true;

    public ICollection<UserRoleEntity> UserRoles { get; set; } = [];
}
