using Farsight.Common;
using FluentValidation;

namespace Farsight.RPC.Providers;

[ConfigOption<Validator>(SectionName = SECTION_NAME)]
public sealed class AdminLoginOptions
{
    public const string SECTION_NAME = "AdminLogin";

    public string User { get; set; } = "admin";

    public string Password { get; set; } = "change-me";

    public sealed class Validator : AbstractValidator<AdminLoginOptions>
    {
        public Validator()
        {
            RuleFor(x => x.User).NotEmpty();
            RuleFor(x => x.Password).NotEmpty();
        }
    }
}
