using Farsight.Rpc.Api.Auth;
using Farsight.Rpc.Api.Services;
using Farsight.Rpc.Api.Validation;
using Farsight.Rpc.Types;
using FastEndpoints;
using FluentValidation;

namespace Farsight.Rpc.Api.Endpoints.Rpcs.Validate;

public sealed class POST(ChainService chainService) : Endpoint<POST.Request, POST.Response>
{
    private static readonly TimeSpan _validationTimeout = TimeSpan.FromSeconds(3);

    public sealed record Request(Uri Address, string Chain, RpcType? RpcType);

    public new sealed record Response(ulong ChainId, TracingMode? TracingMode);

    public sealed class Validator : Validator<Request>
    {
        public Validator(ChainService chainService)
        {
            RuleFor(x => x.Address)
                .ApplyRpcAddressValidation();

            RuleFor(x => x.Chain)
                .ApplyChainValidation(chainService);

            RuleFor(x => x.RpcType)
                .NotNull()
                .WithMessage("RPC type is required.")
                .IsInEnum()
                .WithMessage("RPC type is invalid.");
        }
    }

    public override void Configure()
    {
        Post("/api/Rpcs/Validate");
        Roles(AuthRoles.ADMIN);
    }

    public override async Task HandleAsync(Request req, CancellationToken ct)
    {
        var validation = await chainService.IsValidRpcAsync(
            req.Address,
            req.Chain,
            _validationTimeout,
            req.RpcType == RpcType.Tracing,
            ct);

        if(!validation.IsValid)
        {
            ThrowError(validation.ErrorMessage ?? "RPC validation failed.", validation.ErrorStatusCode);
        }

        await Send.OkAsync(new Response(validation.ChainId, validation.TracingMode), ct);
    }
}
