using Farsight.Common;
using FluentValidation;

namespace Farsight.RPC.Providers;

[ConfigOption<Validator>(SectionName = SectionName)]
public sealed class BootstrapViewerClientOptions
{
    public const string SectionName = "BootstrapViewerClient";

    public string Name { get; set; } = "default-sdk";

    public string ApiKey { get; set; } = "change-me-viewer-key";

    public sealed class Validator : AbstractValidator<BootstrapViewerClientOptions>
    {
        public Validator()
        {
            RuleFor(x => x.Name).NotEmpty();
            RuleFor(x => x.ApiKey).NotEmpty();
        }
    }
}
