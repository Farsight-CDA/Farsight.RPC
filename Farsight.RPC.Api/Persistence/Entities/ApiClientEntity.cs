using Farsight.Rpc.Types;

namespace Farsight.Rpc.Api.Persistence.Entities;

public sealed class ApiClientEntity
{
    public Guid Id { get; set; }

    public string ApiKey { get; set; } = String.Empty;

    public Guid? ApplicationId { get; set; }

    public ApplicationEntity? Application { get; set; }

    public HostEnvironment? Environment { get; set; }

    public bool IsEnabled { get; set; } = true;

    public DateTimeOffset CreatedUtc { get; set; }

    public DateTimeOffset UpdatedUtc { get; set; }
}
