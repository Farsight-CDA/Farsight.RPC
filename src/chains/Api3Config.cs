using EtherSharp.Types;

namespace Farsight.Chains;

/// <summary>
/// Configuration for the API3 oracle on a chain.
/// </summary>
/// <param name="MarketV2Address">The address of the API3 MarketV2 contract.</param>
public sealed record Api3Config(
    Address MarketV2Address
);