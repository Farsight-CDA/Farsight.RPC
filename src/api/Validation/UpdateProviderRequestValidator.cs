using Farsight.Rpc.Api.Endpoints.Admin.Providers;
using FluentValidation;

namespace Farsight.Rpc.Api.Validation;

public sealed class UpdateProviderRequestValidator : AbstractValidator<UpdateProviderEndpoint.Request>
{
    public UpdateProviderRequestValidator()
    {
        RuleFor(x => x.RateLimit)
            .GreaterThan(0)
            .WithMessage("Rate limit must be greater than 0.");
    }
}
