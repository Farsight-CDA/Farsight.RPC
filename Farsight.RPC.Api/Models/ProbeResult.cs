using Farsight.RPC.Types;

namespace Farsight.RPC.Api.Models;

public sealed record ProbeResult(bool Succeeded, string Message, TracingMode? DetectedTracingMode);
