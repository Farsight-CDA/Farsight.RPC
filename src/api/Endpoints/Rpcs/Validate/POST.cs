using EtherSharp.Client;
using EtherSharp.Query;
using Farsight.Common.Extensions;
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

    public new sealed record Response(ulong ChainId);

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
        using var cts = CancellationTokenSource.CreateLinkedTokenSource(ct);
        cts.CancelAfter(_validationTimeout);

        try
        {
            ulong expectedChainId = chainService.Chains.Single(x => x.Name.Equals(req.Chain, StringComparison.OrdinalIgnoreCase)).ChainId;

            await using var client = req.Address.Scheme is "ws" or "wss"
                 ? EtherClientBuilder.CreateForWebsocket(req.Address).BuildReadClient()
                 : EtherClientBuilder.CreateForHttpRpc(req.Address).BuildReadClient();

            ulong actualChainId = await client.InitializeAsync(IQuery.GetChainId(), cts.Token);
            if(actualChainId != expectedChainId)
            {
                ThrowError($"RPC for {req.Chain} returned chain id {actualChainId}, expected {expectedChainId}.", 400);
            }

            await Send.OkAsync(new Response(actualChainId), ct);
        }
        catch(OperationCanceledException) when(!ct.IsCancellationRequested)
        {
            ThrowError("RPC validation timed out.", 504);
        }
        catch(Exception ex)
        {
            ThrowError(ex.GetBaseException().Message, 502);
        }
    }
}
