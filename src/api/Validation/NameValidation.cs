using FluentValidation;
using System.Text.RegularExpressions;

namespace Farsight.Rpc.Api.Validation;

internal static partial class NameValidation
{
    public const string REQUIRED_MESSAGE = "Name is required.";
    public const string OUTER_WHITESPACE_MESSAGE = "Name cannot have leading or trailing whitespace.";
    public const string ALLOWED_CHARACTERS_MESSAGE = "Name can only contain letters, numbers, underscores, and hyphens.";

    public static IRuleBuilderOptions<T, string?> ApplyStandardRules<T>(this IRuleBuilderInitial<T, string?> ruleBuilder)
        => ruleBuilder
            .Cascade(CascadeMode.Stop)
            .Must(static name => !String.IsNullOrWhiteSpace(name))
            .WithMessage(REQUIRED_MESSAGE)
            .Must(static name => name is not null && name.AsSpan().Trim().Length == name.Length)
            .WithMessage(OUTER_WHITESPACE_MESSAGE)
            .Must(static name => name is not null && AllowedCharactersRegex().IsMatch(name))
            .WithMessage(ALLOWED_CHARACTERS_MESSAGE);

    [GeneratedRegex("^[A-Za-z0-9_-]+$", RegexOptions.CultureInvariant)]
    private static partial Regex AllowedCharactersRegex();
}
