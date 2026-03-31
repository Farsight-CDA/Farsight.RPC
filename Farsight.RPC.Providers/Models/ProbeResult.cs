using Farsight.RPC.Providers.Contracts;

namespace Farsight.RPC.Providers.Models;

public sealed record ProbeResult(bool Succeeded, string Message, TracingMode? DetectedTracingMode);
