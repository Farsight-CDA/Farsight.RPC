using EtherSharp.Client;
using EtherSharp.Client.Services.TxPublisher;
using EtherSharp.Client.Services.TxScheduler;
using EtherSharp.Common.Exceptions;
using EtherSharp.RPC.Transport;
using EtherSharp.Tx;
using EtherSharp.Tx.EIP1559;
using EtherSharp.Wallet;
using Farsight.Chains;
using Farsight.Common;
using Farsight.Common.Extensions;
using Farsight.Rpc.Types;

namespace Farsight.Rpc.Api.Services;

public partial class ChainService : Singleton
{
    private static readonly IEtherSigner _publicRpcValidationSigner = EtherHdWallet.Create();
    private static readonly ReadOnlyMemory<ChainMetadata> _chains = ChainRegistry.GetAllChains();

    public sealed record RpcValidationResult(bool IsValid, ulong ChainId, TracingMode? TracingMode, string? ErrorMessage, int ErrorStatusCode);

    public bool IsRegisteredChain(string chainName)
        => _chains.Any(x => x.Name.Equals(chainName, StringComparison.OrdinalIgnoreCase));

    public async Task<RpcValidationResult> IsValidRpcAsync(Uri address, string chain, TimeSpan timeout, bool validateTracing = false, CancellationToken cancellationToken = default)
    {
        using var cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        cts.CancelAfter(timeout);

        IEtherTxClient? client = null;

        try
        {
            ulong expectedChainId = _chains.Single(x => x.Name.Equals(chain, StringComparison.OrdinalIgnoreCase)).ChainId;
            client = CreateValidationTxClient(address, timeout);

            await client.InitializeAsync(forceNoQuery: true, cts.Token);
            ulong actualChainId = client.ChainId;

            if(actualChainId != expectedChainId)
            {
                return new RpcValidationResult(false, actualChainId, null, $"RPC for {chain} returned chain id {actualChainId}, expected {expectedChainId}.", 400);
            }

            var transfer = client.ETH.Transfer(_publicRpcValidationSigner.Address, 1);
            var txHandler = await client.PrepareTxAsync(transfer, EIP1559TxParams.Default, new EIP1559GasParams(21_000, 1, 1)).WaitAsync(cts.Token);
            bool expectedTransactionFailure = false;
            var txResult = await txHandler.PublishAndConfirmAsync((error, builder, _) =>
            {
                if(error is TxConfirmationError.UnhandledException unhandledTxError)
                {
                    string txError = unhandledTxError.Exception.GetBaseException().Message;
                    expectedTransactionFailure = txError.Contains("insufficient funds", StringComparison.OrdinalIgnoreCase)
                        || txError.Contains("insufficient balance", StringComparison.OrdinalIgnoreCase);
                }

                return builder.CancelTransaction();
            }).WaitAsync(cts.Token);

            if(txResult is TxConfirmationResult.UnhandledException unhandledException)
            {
                string txError = unhandledException.Exception.GetBaseException().Message;
                expectedTransactionFailure = txError.Contains("insufficient funds", StringComparison.OrdinalIgnoreCase)
                    || txError.Contains("insufficient balance", StringComparison.OrdinalIgnoreCase);
            }

            if(!expectedTransactionFailure)
            {
                return new RpcValidationResult(false, actualChainId, null, "RPC does not expose usable eth_sendRawTransaction support.", 400);
            }

            TracingMode? tracingMode = null;

            if(validateTracing)
            {
                tracingMode = await ProbeTracingModeAsync(client, cts.Token);
            }
            return new RpcValidationResult(true, actualChainId, tracingMode, null, 0);
        }
        catch(OperationCanceledException) when(!cancellationToken.IsCancellationRequested)
        {
            return new RpcValidationResult(false, 0, null, "RPC validation timed out.", 504);
        }
        catch(InvalidOperationException ex)
        {
            return new RpcValidationResult(false, 0, null, ex.Message, 400);
        }
        catch(Exception ex) when(!cancellationToken.IsCancellationRequested)
        {
            return new RpcValidationResult(false, 0, null, ex.GetBaseException().Message, 502);
        }
        finally
        {
            if(client is not null)
            {
                try
                {
                    await client.DisposeAsync();
                }
                catch
                {
                    // Cleanup failures must not invalidate an RPC that already passed validation.
                }
            }
        }
    }

    private static IEtherTxClient CreateValidationTxClient(Uri address, TimeSpan timeout)
        => EtherClientBuilder.CreateEmpty()
            .WithSigner(_publicRpcValidationSigner)
            .WithBlockingSequentialTxScheduler(NonceMode.ExclusiveLocal)
            .WithTxPublisher<BasicTxPublisher>()
            .AddTxTypeHandler<EIP1559TxTypeHandler, EIP1559GasFeeProvider, EIP1559GasFeeProvider.Configuration, EIP1559Transaction, EIP1559TxParams, EIP1559GasParams>()
            .WithRPCTransport(provider => address.Scheme is "ws" or "wss"
                ? new WssJsonRpcTransport(address, timeout, provider, [])
                : new HttpJsonRpcTransport(address, provider, []))
            .BuildTxClient();

    private static async Task<TracingMode> ProbeTracingModeAsync(IEtherClient client, CancellationToken cancellationToken = default)
    {
        try
        {
            _ = await client.Trace.TraceTransactionCallsAsync("0x", cancellationToken);
        }
        catch(RPCException ex) when(ex.Message.Contains("invalid argument", StringComparison.OrdinalIgnoreCase) || ex.Message.Contains("Invalid params", StringComparison.OrdinalIgnoreCase))
        {
            return TracingMode.Trace;
        }
        catch(RPCException ex)
        when(ex.Message.Contains("trace_replayTransaction", StringComparison.OrdinalIgnoreCase) || ex.Message.Contains("Method not found", StringComparison.OrdinalIgnoreCase) || ex.Message.Contains("rpc method is not available", StringComparison.OrdinalIgnoreCase))
        {
            // Method-not-found errors include the missing method name, so fall through to the next probe.
        }

        try
        {
            _ = await client.Debug.TraceTransactionCallsAsync("0x", cancellationToken);
        }
        catch(RPCException ex) when(ex.Message.Contains("invalid argument", StringComparison.OrdinalIgnoreCase) || ex.Message.Contains("Invalid params", StringComparison.OrdinalIgnoreCase))
        {
            return TracingMode.Debug;
        }
        catch(RPCException ex)
        when(ex.Message.Contains("debug_traceTransaction", StringComparison.OrdinalIgnoreCase) || ex.Message.Contains("Method not found", StringComparison.OrdinalIgnoreCase) || ex.Message.Contains("rpc method is not available", StringComparison.OrdinalIgnoreCase))
        {
            // Method-not-found errors include the missing method name, so fall through to the final failure.
        }

        throw new InvalidOperationException("No tracing mode supported");
    }
}
