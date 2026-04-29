using EtherSharp.Types;

namespace Farsight.Chains;

/// <summary>
/// Describes the native currency of a chain.
/// </summary>
/// <param name="Name">Full name of the native currency.</param>
/// <param name="Symbol">Ticker symbol of the native currency.</param>
/// <param name="Decimals">Number of decimal places for the native currency.</param>
/// <param name="PythFeedId">The Pyth price feed identifier for the currency, if one exists.</param>
/// <param name="WrappedTokenAddress">The wrapped native token contract address, if the chain has one.</param>
public sealed record NativeCurrency(
    string Name,
    string Symbol,
    byte Decimals,
    Bytes32? PythFeedId,
    Address? WrappedTokenAddress
);
