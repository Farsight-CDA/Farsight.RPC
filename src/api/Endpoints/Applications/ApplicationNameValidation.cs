using System.Text.RegularExpressions;

namespace Farsight.Rpc.Api.Endpoints.Applications;

internal static partial class ApplicationNameValidation
{
    public const string REQUIRED_MESSAGE = "Name is required.";
    public const string OUTER_WHITESPACE_MESSAGE = "Name cannot have leading or trailing whitespace.";
    public const string ALLOWED_CHARACTERS_MESSAGE = "Name can only contain letters, numbers, underscores, and hyphens.";

    public static string? GetValidationError(string name)
    {
        if(String.IsNullOrWhiteSpace(name))
        {
            return REQUIRED_MESSAGE;
        }

        if(name.AsSpan().Trim().Length != name.Length)
        {
            return OUTER_WHITESPACE_MESSAGE;
        }

        if(!HasAllowedCharacters(name))
        {
            return ALLOWED_CHARACTERS_MESSAGE;
        }

        return null;
    }

    public static bool HasAllowedCharacters(string name)
        => AllowedCharactersRegex().IsMatch(name);

    [GeneratedRegex("^[A-Za-z0-9_-]+$", RegexOptions.CultureInvariant)]
    private static partial Regex AllowedCharactersRegex();
}
