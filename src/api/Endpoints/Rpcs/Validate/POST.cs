using Farsight.Chains;
using Farsight.Rpc.Api.Auth;
using Farsight.Rpc.Api.Services;
using Farsight.Rpc.Api.Validation;
using Farsight.Rpc.Types;
using FastEndpoints;
using FluentValidation;

namespace Farsight.Rpc.Api.Endpoints.Rpcs.Validate;

public sealed class POST(RpcCapabilityProbe capabilityProbe) : Endpoint<POST.Request, RpcProbeResult>
{
    private static readonly TimeSpan _validationTimeout = TimeSpan.FromSeconds(10);

    public sealed record Request(Uri Address, string Chain);

    public sealed class Validator : Validator<Request>
    {
        public Validator()
        {
            RuleFor(x => x.Address)
                .ApplyRpcAddressValidation();

            RuleFor(x => x.Chain)
                .ApplyChainValidation();
        }
    }

    public override void Configure()
    {
        Post("/api/Rpcs/Validate");
        Roles(AuthRoles.ADMIN);
    }

    public override async Task HandleAsync(Request req, CancellationToken ct)
    {
        ulong expectedChainId = ChainRegistry.Chains
            .Single(x => x.Name.Equals(req.Chain, StringComparison.OrdinalIgnoreCase))
            .ChainId;

        using var cts = CancellationTokenSource.CreateLinkedTokenSource(ct);
        cts.CancelAfter(_validationTimeout);

        RpcProbeResult result;
        try
        {
            result = await capabilityProbe.ProbeAsync(req.Address, cts.Token);
        }
        catch(OperationCanceledException) when(!ct.IsCancellationRequested)
        {
            ThrowError("RPC validation timed out.", 504);
            return;
        }
        catch(Exception ex) when(!ct.IsCancellationRequested)
        {
            ThrowError(ex.GetBaseException().Message, 502);
            return;
        }

        if(result.ChainId != expectedChainId)
        {
            ThrowError($"RPC returned chain id {result.ChainId}, expected {expectedChainId} for {req.Chain}.", 400);
            return;
        }

        await Send.OkAsync(result, ct);
    }
}
