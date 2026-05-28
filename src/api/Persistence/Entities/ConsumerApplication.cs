using Farsight.Rpc.Api.Persistence.Entities.Rpc;
using Farsight.Rpc.Types;

namespace Farsight.Rpc.Api.Persistence.Entities;

public sealed record ConsumerApplication
{
    public required Guid Id { get; init; }
    public required string Name { get; set; }

    public required RpcStructureDefinition Structure { get; set; }

    public string Color { get; set; } = "#6B7280";

    //Navigation Property
    public List<ApplicationEnvironment>? Environments { get; private set; }

    //Navigation Property
    public List<ConsumerApiKey>? ApiKeys { get; private set; }

    //Navigation Property
    public List<RpcEndpoint>? Rpcs { get; private set; }
}
