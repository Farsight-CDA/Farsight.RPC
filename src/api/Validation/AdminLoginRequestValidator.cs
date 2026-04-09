using Farsight.Rpc.Api.Endpoints.Admin.Auth;
using FluentValidation;

namespace Farsight.Rpc.Api.Validation;

public sealed class AdminLoginRequestValidator : AbstractValidator<AdminLoginEndpoint.Request>
{
    public AdminLoginRequestValidator()
    {
        RuleFor(x => x.UserName).NotEmpty();
        RuleFor(x => x.Password).NotEmpty();
    }
}
