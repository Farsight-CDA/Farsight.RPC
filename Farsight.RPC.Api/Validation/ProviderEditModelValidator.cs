using Farsight.RPC.Types;
using Farsight.RPC.Api.Models;
using FluentValidation;

namespace Farsight.RPC.Api.Validation;

public sealed class ProviderEditModelValidator : AbstractValidator<ProviderEditModel>
{
    public ProviderEditModelValidator()
    {
        RuleFor(x => x.ApplicationId)
            .NotEmpty()
            .WithMessage("Application is required.");

        RuleFor(x => x.ChainId)
            .NotEmpty()
            .WithMessage("Chain is required.");

        RuleFor(x => x.ProviderId)
            .NotEmpty()
            .WithMessage("Provider is required.");

        RuleFor(x => x.Address)
            .NotEmpty()
            .Must(RpcValidationRules.BeValidRpcAddress)
            .WithMessage("Address must be an absolute http, https, ws, or wss URL.");

        When(x => x.Type == RpcEndpointType.Archive, () =>
        {
            RuleFor(x => x.IndexerStepSize)
                .NotNull()
                .GreaterThan(0UL)
                .WithMessage("IndexerStepSize must be greater than 0 for archive endpoints.");

            RuleFor(x => x.DexIndexStepSize)
                .GreaterThan(0UL)
                .When(x => x.DexIndexStepSize.HasValue)
                .WithMessage("DexIndexStepSize must be greater than 0 when provided.");
        });
    }
}
