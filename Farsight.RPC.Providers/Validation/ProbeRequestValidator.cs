using Farsight.RPC.Providers.Models;
using FluentValidation;

namespace Farsight.RPC.Providers.Validation;

public sealed class ProbeRequestValidator : AbstractValidator<ProbeRequest>
{
    public ProbeRequestValidator()
    {
        RuleFor(x => x.Address)
            .NotEmpty()
            .Must(RpcValidationRules.BeValidRpcAddress)
            .WithMessage("Address must be an absolute http, https, ws, or wss URL.");
    }
}
