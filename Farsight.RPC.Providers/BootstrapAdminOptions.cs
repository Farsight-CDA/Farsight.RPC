using Farsight.Common;
using FluentValidation;

namespace Farsight.RPC.Providers;

[ConfigOption<Validator>(SectionName = SectionName)]
public sealed class BootstrapAdminOptions
{
    public const string SectionName = "BootstrapAdmin";

    public string UserName { get; set; } = "admin";

    public string Password { get; set; } = "change-me";

    public sealed class Validator : AbstractValidator<BootstrapAdminOptions>
    {
        public Validator()
        {
            RuleFor(x => x.UserName).NotEmpty();
            RuleFor(x => x.Password).NotEmpty();
        }
    }
}
