using EtherSharp.Types;

namespace Farsight.Chains;

/// <summary>
/// Metadata describing the capabilities and configuration of a blockchain.
/// </summary>
/// <param name="Name">The human-readable name of the chain.</param>
/// <param name="ChainId">The EVM chain identifier.</param>
/// <param name="CanReorg">Whether the chain can experience reorganizations.</param>
/// <param name="SupportsPriorityFees">Whether the chain supports priority fees.</param>
/// <param name="SupportsGasRefunds">Whether the chain supports gas refunds.</param>
/// <param name="BlockGasLimitM">The block gas limit in millions.</param>
/// <param name="NativeCurrency">The native currency of the chain.</param>
/// <param name="FlashCallerAddress">The address authorized for flash loan calls.</param>
/// <param name="StablecoinAddresses">Addresses of trusted stablecoins on the chain.</param>
/// <param name="Api3">Optional API3 oracle configuration.</param>
/// <param name="Pyth">Optional Pyth oracle configuration.</param>
public sealed record ChainMetadata(
    string Name,
    ulong ChainId,
    bool CanReorg,
    bool SupportsPriorityFees,
    bool SupportsGasRefunds,
    ulong BlockGasLimitM,

    NativeCurrency NativeCurrency,

    Address FlashCallerAddress,
    ReadOnlyMemory<Address> StablecoinAddresses,

    Api3Config? Api3,
    PythConfig? Pyth
);
