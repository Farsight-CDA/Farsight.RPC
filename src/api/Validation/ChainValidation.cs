using Farsight.Rpc.Api.Services;
using FluentValidation;

namespace Farsight.Rpc.Api.Validation;

internal static class ChainValidation
{
    public const string REQUIRED_MESSAGE = "Chain is required.";
    public const string LENGTH_MESSAGE = "Chain cannot be longer than 30 characters.";
    public const string INVALID_MESSAGE = "Chain is invalid.";

    public static IRuleBuilderOptions<T, string> ApplyChainValidation<T>(this IRuleBuilderInitial<T, string> ruleBuilder, ChainService chainService)
        => ruleBuilder
            .Cascade(CascadeMode.Stop)
            .Must(static chain => !String.IsNullOrWhiteSpace(chain))
            .WithMessage(REQUIRED_MESSAGE)
            .MaximumLength(30)
            .WithMessage(LENGTH_MESSAGE)
            .Must(chainService.IsRegisteredChain)
            .WithMessage(INVALID_MESSAGE);
}
