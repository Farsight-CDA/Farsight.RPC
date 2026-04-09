using Farsight.Rpc.Types;

namespace Farsight.Rpc.Api.Models;

public sealed record ProbeResult(
    bool Succeeded,
    string Message,
    TracingMode? DetectedTracingMode
);
