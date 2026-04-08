using Farsight.Rpc.Api.Models;
using FluentValidation;

namespace Farsight.Rpc.Api.Validation;

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
