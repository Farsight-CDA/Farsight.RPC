using EtherSharp.Common;
using EtherSharp.Common.Exceptions;
using EtherSharp.RPC;
using EtherSharp.Types;
using Farsight.Rpc.Types;
using Microsoft.Extensions.Diagnostics.Metrics;
using Microsoft.Extensions.Logging;
using Polly;
using Polly.Retry;
using System.Buffers;
using System.Diagnostics;
using System.Diagnostics.Metrics;
using System.Net.Sockets;
using System.Net.WebSockets;

namespace Farsight.Rpc.Sdk.Evm;

public sealed class EvmRpcResiliencyMiddleware : IRpcMiddleware
{
    private const string METER_NAME = Diagnostics.METER_NAME;
    private const string RETRY_COUNTER_NAME = "ethersharp.rpc.retries";
    private const string OVERWHELMED_COUNTER_NAME = "ethersharp.rpc.overwhelmed";
    private const double SOFT_OVERWHELMED_DELAY_MULTIPLIER = 4;

    private readonly ILogger? _logger;
    private readonly Counter<long>? _retryCounter;
    private readonly Counter<long>? _overwhelmedCounter;
    private readonly EvmRpcResiliencyOptions _options;

    private readonly TagList _retryTags;
    private readonly TagList _overwhelmedSoftTags;
    private readonly TagList _overwhelmedHardTags;

    private readonly SearchValues<string>? _transientRpcMessages;
    private readonly SearchValues<string>? _softRpcMessages;
    private readonly SearchValues<string>? _hardRpcMessages;

    public EvmRpcResiliencyMiddleware(
        string chainName,
        IEnumerable<RpcErrorGroupDto> errorGroups,
        EvmRpcResiliencyOptions? options = null,
        ILoggerFactory? loggerFactory = null,
        IMeterFactory? meterFactory = null)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(chainName);

        _options = options ?? new EvmRpcResiliencyOptions();
        _logger = loggerFactory?.CreateLogger<EvmRpcResiliencyMiddleware>();

        var meter = meterFactory?.Create(METER_NAME);
        _retryCounter = meter?.CreateCounter<long>(RETRY_COUNTER_NAME);
        _overwhelmedCounter = meter?.CreateCounter<long>(OVERWHELMED_COUNTER_NAME);

        _retryTags = new() { { "chain", chainName } };
        _overwhelmedSoftTags = new() { { "chain", chainName }, { "kind", "soft" } };
        _overwhelmedHardTags = new() { { "chain", chainName }, { "kind", "hard" } };

        _retryCounter?.Add(0, _retryTags);
        _overwhelmedCounter?.Add(0, _overwhelmedSoftTags);
        _overwhelmedCounter?.Add(0, _overwhelmedHardTags);

        _transientRpcMessages = CreateSearchValues(errorGroups, RpcErrorAction.Transient);
        _softRpcMessages = CreateSearchValues(errorGroups, RpcErrorAction.SoftOverwhelmed);
        _hardRpcMessages = CreateSearchValues(errorGroups, RpcErrorAction.HardOverwhelmed);
    }

    public async Task<RpcResult<TResult>> HandleAsync<TResult>(Func<CancellationToken, Task<RpcResult<TResult>>> onNext, CancellationToken cancellationToken)
    {
        int softOverwhelmedRetries = 0;
        string? lastOverwhelmedReason = null;

        var pipeline = new ResiliencePipelineBuilder<RpcCallResult<TResult>>()
            .AddRetry(new RetryStrategyOptions<RpcCallResult<TResult>>
            {
                MaxRetryAttempts = _options.MaxRetryAttempts,
                Delay = _options.RetryDelay,
                MaxDelay = _options.MaxRetryDelay,
                BackoffType = DelayBackoffType.Exponential,
                UseJitter = true,
                ShouldHandle = args => new ValueTask<bool>(args.Outcome.Result switch
                {
                    RpcCallResult<TResult>.Transient => true,
                    RpcCallResult<TResult>.SoftOverwhelm => softOverwhelmedRetries < _options.MaxSoftOverwhelmedRetries,
                    _ => false
                }),
                OnRetry = async args =>
                {
                    var (reason, retryDelay) = args.Outcome.Result switch
                    {
                        RpcCallResult<TResult>.Transient transient => (transient.Reason, args.RetryDelay),
                        RpcCallResult<TResult>.SoftOverwhelm overwhelmed => (overwhelmed.Reason, args.RetryDelay * SOFT_OVERWHELMED_DELAY_MULTIPLIER),
                        _ => throw new UnreachableException()
                    };

                    _logger?.LogDebug("Retrying RPC request after {Duration}; Reason={Reason}", retryDelay, reason);
                    _retryCounter?.Add(1, _retryTags);

                    if(args.Outcome.Result is RpcCallResult<TResult>.SoftOverwhelm)
                    {
                        softOverwhelmedRetries++;
                        lastOverwhelmedReason = reason;
                        _overwhelmedCounter?.Add(1, _overwhelmedSoftTags);

                        var extraDelay = retryDelay - args.RetryDelay;
                        if(extraDelay > TimeSpan.Zero)
                        {
                            await Task.Delay(extraDelay, args.Context.CancellationToken);
                        }
                    }
                }
            })
            .Build();

        var outcome = await pipeline.ExecuteAsync(
            token => new ValueTask<RpcCallResult<TResult>>(ExecuteAttemptAsync(onNext, token)),
            cancellationToken
        );

        if(outcome is RpcCallResult<TResult>.HardOverwhelm or RpcCallResult<TResult>.SoftOverwhelm)
        {
            string reason = outcome switch
            {
                RpcCallResult<TResult>.HardOverwhelm hardOverwhelm => hardOverwhelm.Reason,
                RpcCallResult<TResult>.SoftOverwhelm softOverwhelm => lastOverwhelmedReason ?? softOverwhelm.Reason,
                _ => throw new UnreachableException()
            };

            _logger?.LogDebug("RPC endpoint is overwhelmed; Reason={Reason}", reason);
            _overwhelmedCounter?.Add(1, _overwhelmedHardTags);
            throw new RpcOverwhelmedException(reason);
        }

        return outcome switch
        {
            RpcCallResult<TResult>.Success success => success.Result,
            RpcCallResult<TResult>.Transient transient => throw new RpcRetriesExhaustedException(transient.Reason),
            _ => throw new UnreachableException()
        };
    }

    private async Task<RpcCallResult<TResult>> ExecuteAttemptAsync<TResult>(Func<CancellationToken, Task<RpcResult<TResult>>> onNext, CancellationToken cancellationToken)
    {
        using var cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        cts.CancelAfter(_options.RequestTimeout);

        try
        {
            var result = await onNext(cts.Token);
            return ClassifyResult(result);
        }
        catch(OperationCanceledException) when(!cancellationToken.IsCancellationRequested)
        {
            string reason = $"Request aborted after {_options.RequestTimeout.TotalSeconds:0}s timeout";
            _logger?.LogWarning("{Reason}", reason);
            return new RpcCallResult<TResult>.SoftOverwhelm(reason);
        }
        catch(Exception ex) when(ClassifyException<TResult>(ex) is { } classified)
        {
            return classified;
        }
    }

    private RpcCallResult<TResult> ClassifyResult<TResult>(RpcResult<TResult> result)
    {
        if(result is not RpcResult<TResult>.Error errorResult)
        {
            return new RpcCallResult<TResult>.Success(result);
        }
        if(errorResult.Message == "VM execution error." && errorResult.Data is not null && errorResult.Data.StartsWith("err: revert (", StringComparison.Ordinal))
        {
            throw new CallRevertedException.CallRevertedWithNoDataException(Address.Zero);
        }
        if(ContainsAny(errorResult.Message, _hardRpcMessages))
        {
            return new RpcCallResult<TResult>.HardOverwhelm(errorResult.Message);
        }
        if(ContainsAny(errorResult.Message, _softRpcMessages))
        {
            return new RpcCallResult<TResult>.SoftOverwhelm(errorResult.Message);
        }
        if(ContainsAny(errorResult.Message, _transientRpcMessages))
        {
            return new RpcCallResult<TResult>.Transient(errorResult.Message);
        }
        //
        return new RpcCallResult<TResult>.Success(result);
    }

    private RpcCallResult<TResult>? ClassifyException<TResult>(Exception ex)
    {
        if(ContainsAny(ex.Message, _hardRpcMessages))
        {
            return new RpcCallResult<TResult>.HardOverwhelm(ex.Message);
        }
        if(ContainsAny(ex.Message, _softRpcMessages))
        {
            return new RpcCallResult<TResult>.SoftOverwhelm(ex.Message);
        }
        if(ContainsAny(ex.Message, _transientRpcMessages))
        {
            return new RpcCallResult<TResult>.Transient(ex.Message);
        }
        if(ex is HttpRequestException or IOException or SocketException or WebSocketException or TimeoutException)
        {
            return new RpcCallResult<TResult>.Transient(ex.Message);
        }
        //
        return ex.InnerException is null ? null : ClassifyException<TResult>(ex.InnerException);
    }

    private static SearchValues<string>? CreateSearchValues(IEnumerable<RpcErrorGroupDto> errorGroups, RpcErrorAction action)
    {
        string[] errors = [.. errorGroups
            .Where(group => group.Action == action)
            .SelectMany(group => group.Errors)
            .Where(error => !String.IsNullOrWhiteSpace(error))];

        return errors.Length == 0
            ? null
            : SearchValues.Create(errors, StringComparison.OrdinalIgnoreCase);
    }

    private static bool ContainsAny(string value, SearchValues<string>? searchValues)
        => searchValues is not null && value.AsSpan().ContainsAny(searchValues);

    private abstract record RpcCallResult<TResult>
    {
        public sealed record Success(RpcResult<TResult> Result) : RpcCallResult<TResult>;
        public sealed record Transient(string Reason) : RpcCallResult<TResult>;
        public sealed record SoftOverwhelm(string Reason) : RpcCallResult<TResult>;
        public sealed record HardOverwhelm(string Reason) : RpcCallResult<TResult>;
    }
}
