using Farsight.Common;
using FluentValidation;

namespace Farsight.Rpc.Api.Configuration;

[ConfigOption<Validator>(SectionName = SECTION_NAME)]
public sealed class AdminLoginConfiguration
{
    public const string SECTION_NAME = "AdminLogin";

    public List<UserConfiguration> Users { get; set; } = [];

    public sealed class Validator : AbstractValidator<AdminLoginConfiguration>
    {
        public Validator()
        {
            RuleFor(x => x.Users)
                .NotEmpty()
                .Must(users => users is null || users.Select(x => x.Username).Distinct(StringComparer.Ordinal).Count() == users.Count)
                .WithMessage("Admin login usernames must be unique.");

            RuleForEach(x => x.Users).ChildRules(user =>
            {
                user.RuleFor(x => x.Username).NotEmpty().MaximumLength(200);
                user.RuleFor(x => x.PasswordHash)
                    .NotEmpty()
                    .Length(64)
                    .Matches("^[a-fA-F0-9]{64}$")
                    .WithMessage("Admin login password hashes must be SHA-256 hexadecimal strings.");
            });
        }
    }

    public sealed class UserConfiguration
    {
        public string Username { get; set; } = String.Empty;
        public string PasswordHash { get; set; } = String.Empty;
    }
}
