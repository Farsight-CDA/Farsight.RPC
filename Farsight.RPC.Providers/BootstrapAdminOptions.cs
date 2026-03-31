namespace Farsight.RPC.Providers;

public sealed class BootstrapAdminOptions
{
    public const string SectionName = "BootstrapAdmin";

    public string UserName { get; set; } = "admin";

    public string Password { get; set; } = "change-me";
}
