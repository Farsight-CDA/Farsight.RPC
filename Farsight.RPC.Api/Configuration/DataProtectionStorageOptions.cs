using Farsight.Common;
using FluentValidation;

namespace Farsight.RPC.Api.Configuration;

[ConfigOption<Validator>(SectionName = "DataProtection")]
public sealed class DataProtectionStorageOptions
{
    public string KeysDirectory { get; set; } = "/var/lib/farsight-rpc-providers/data-protection";

    public sealed class Validator : AbstractValidator<DataProtectionStorageOptions>
    {
        public Validator()
        {
            RuleFor(x => x.KeysDirectory).NotEmpty();
        }
    }
}
