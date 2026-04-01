namespace Farsight.RPC.Providers.Validation;

public static class RpcValidationRules
{
    private static readonly HashSet<string> AllowedSchemes = new(StringComparer.OrdinalIgnoreCase)
    {
        Uri.UriSchemeHttp,
        Uri.UriSchemeHttps,
        "ws",
        "wss"
    };

    public static bool BeValidRpcAddress(string? value)
        => !string.IsNullOrWhiteSpace(value)
           && Uri.TryCreate(value.Trim(), UriKind.Absolute, out var uri)
           && AllowedSchemes.Contains(uri.Scheme);
}
