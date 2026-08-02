using FluentValidation;
using System.Text.RegularExpressions;

namespace Farsight.Rpc.Api.Common.Extensions;

internal static partial class ValidationExtensions
{
    extension<T>(IRuleBuilderInitial<T, string?> ruleBuilder)
    {
        public IRuleBuilderOptions<T, string?> ApplyNameValidation()
            => ruleBuilder
                .Cascade(CascadeMode.Stop)
                .Must(static name => !String.IsNullOrWhiteSpace(name))
                .WithMessage("Name is required.")
                .Must(static name => name is not null && name.AsSpan().Trim().Length == name.Length)
                .WithMessage("Name cannot have leading or trailing whitespace.")
                .Must(static name => name is not null && AllowedNameCharactersRegex().IsMatch(name))
                .WithMessage("Name can only contain letters, numbers, spaces, periods, underscores, and hyphens.");

        public IRuleBuilderOptions<T, string?> ApplyColorValidation()
            => ruleBuilder
                .Cascade(CascadeMode.Stop)
                .Must(static color => !String.IsNullOrEmpty(color))
                .WithMessage("Color is required.")
                .Must(static color => color is not null && ColorRegex().IsMatch(color))
                .WithMessage("Color must be a valid hex color code (e.g. #FF5722).");
    }

    [GeneratedRegex("^[A-Za-z0-9_. -]+$", RegexOptions.CultureInvariant)]
    private static partial Regex AllowedNameCharactersRegex();

    [GeneratedRegex("^#[0-9A-Fa-f]{6}$", RegexOptions.CultureInvariant)]
    private static partial Regex ColorRegex();
}
