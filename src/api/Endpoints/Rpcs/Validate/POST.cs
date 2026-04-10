using EtherSharp.Client;
using EtherSharp.Query;
using Farsight.Rpc.Api.Auth;
using Farsight.Rpc.Api.Validation;
using FastEndpoints;

namespace Farsight.Rpc.Api.Endpoints.Rpcs.Validate;

public sealed class POST : Endpoint<POST.Request, POST.Response>
{
    public sealed record Request(Uri Address);

    public new sealed record Response(ulong ChainId);

    public sealed class Validator : Validator<Request>
    {
        public Validator()
        {
            RuleFor(x => x.Address)
                .ApplyRpcAddressValidation();
        }
    }

    public override void Configure()
    {
        Post("/api/Rpcs/Validate");
        Roles(AuthRoles.ADMIN);
    }

    public override async Task HandleAsync(Request req, CancellationToken ct)
    {
        using var timeoutCancellationTokenSource = CancellationTokenSource.CreateLinkedTokenSource(ct);
        timeoutCancellationTokenSource.CancelAfter(TimeSpan.FromSeconds(15));

        try
        {
            var client = req.Address.Scheme is "ws" or "wss"
                ? EtherClientBuilder.CreateForWebsocket(req.Address).BuildReadClient()
                : EtherClientBuilder.CreateForHttpRpc(req.Address).BuildReadClient();

            ulong chainId = await client.InitializeAsync(IQuery.GetChainId(), timeoutCancellationTokenSource.Token);

            await Send.OkAsync(new Response(chainId), ct);
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
