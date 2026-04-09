using Farsight.Common;
using FluentValidation;

namespace Farsight.Rpc.Api.Configuration;

[ConfigOption<Validator>(SectionName = SECTION_NAME)]
public sealed class JwtConfiguration
{
    public const string SECTION_NAME = "Jwt";

    public string Secret { get; set; } = "change-me-to-a-32-byte-or-longer-secret";
    public string Issuer { get; set; } = "Farsight.Rpc.Api";
    public string Audience { get; set; } = "Farsight.Rpc.Web";
    public int ExpiryMinutes { get; set; } = 480;

    public sealed class Validator : AbstractValidator<JwtConfiguration>
    {
        public Validator()
        {
            RuleFor(x => x.Secret).MinimumLength(32);
            RuleFor(x => x.Issuer).NotEmpty();
            RuleFor(x => x.Audience).NotEmpty();
            RuleFor(x => x.ExpiryMinutes).GreaterThan(0);
        }
    }
}
