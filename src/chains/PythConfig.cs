using EtherSharp.Types;

namespace Farsight.Chains;

/// <summary>
/// Configuration for the Pyth oracle on a chain.
/// </summary>
/// <param name="PythAddress">The address of the Pyth contract.</param>
public sealed record PythConfig(
    Address PythAddress
);