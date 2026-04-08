using Farsight.Rpc.Types;

namespace Farsight.Rpc.Api.Models;

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
