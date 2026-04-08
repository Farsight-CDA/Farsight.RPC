namespace Farsight.RPC.Providers.Validation;

public static class RpcValidationRules
{
    private static readonly HashSet<string> _allowedSchemes = new(StringComparer.OrdinalIgnoreCase)
    {
        Uri.UriSchemeHttp,
        Uri.UriSchemeHttps,
        "ws",
        "wss"
    };

    public static bool BeValidRpcAddress(string? value)
        => !String.IsNullOrWhiteSpace(value)
           && Uri.TryCreate(value.Trim(), UriKind.Absolute, out var uri)
           && _allowedSchemes.Contains(uri.Scheme);
}
