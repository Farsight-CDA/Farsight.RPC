using Farsight.Rpc.Api.Persistence.Entities.Rpc;

namespace Farsight.Rpc.Api.Persistence.Entities;

public sealed record ConsumerApplication
{
    public required Guid Id { get; init; }
    public required string Name { get; set; }

    public string Color { get; set; } = "#6B7280";

    //Navigation Property
    public List<ApplicationEnvironment>? Environments { get; private set; }

    //Navigation Property
    public List<ConsumerApiKey>? ApiKeys { get; private set; }

    //Navigation Property
    public List<RpcEndpoint>? Rpcs { get; private set; }

    //Navigation Property
    public List<RpcRule>? RpcRules { get; private set; }
}
