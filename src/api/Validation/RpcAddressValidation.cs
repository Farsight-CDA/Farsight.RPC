using FluentValidation;

namespace Farsight.Rpc.Api.Validation;

internal static class RpcAddressValidation
{
    public const string REQUIRED_MESSAGE = "Address is required.";
    public const string ABSOLUTE_MESSAGE = "Address must be a valid absolute URI.";
    public const string SCHEME_MESSAGE = "Address must use HTTP, HTTPS, WS, or WSS.";

    public static IRuleBuilderOptions<T, Uri> ApplyRpcAddressValidation<T>(this IRuleBuilderInitial<T, Uri> ruleBuilder)
        => ruleBuilder
            .Cascade(CascadeMode.Stop)
            .NotNull()
            .WithMessage(REQUIRED_MESSAGE)
            .Must(static address => address.IsAbsoluteUri)
            .WithMessage(ABSOLUTE_MESSAGE)
            .Must(static address => address.Scheme is "http" or "https" or "ws" or "wss")
            .WithMessage(SCHEME_MESSAGE);
}
