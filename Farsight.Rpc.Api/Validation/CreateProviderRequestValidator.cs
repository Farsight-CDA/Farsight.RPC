using Farsight.Rpc.Api.Endpoints.Admin.Providers;
using FluentValidation;

namespace Farsight.Rpc.Api.Validation;

public sealed class CreateProviderRequestValidator : AbstractValidator<CreateProviderEndpoint.Request>
{
    public CreateProviderRequestValidator()
    {
        RuleFor(x => x.RateLimit)
            .GreaterThan(0)
            .WithMessage("Rate limit must be greater than 0.");
    }
}
