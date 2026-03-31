namespace Farsight.RPC.Providers.Data.Entities;

public sealed class UserEntity
{
    public Guid Id { get; set; }

    public string UserName { get; set; } = string.Empty;

    public string PasswordHash { get; set; } = string.Empty;

    public bool IsEnabled { get; set; } = true;

    public ICollection<UserRoleEntity> UserRoles { get; set; } = [];
}
