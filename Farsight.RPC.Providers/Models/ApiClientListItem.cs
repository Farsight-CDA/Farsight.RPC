using Farsight.RPC.Providers.Contracts;

namespace Farsight.RPC.Providers.Models;

public sealed record ApiClientListItem(
    Guid Id,
    string ApiKey,
    Guid? ApplicationId,
    string? Application,
    HostEnvironment? Environment,
    bool IsEnabled,
    DateTimeOffset CreatedUtc,
    DateTimeOffset UpdatedUtc);

public sealed record ApiClientCreateResult(Guid Id, string ApiKey);
