# Farsight.Chains

Standalone chain metadata for Farsight applications. A .NET library that embeds JSON chain configuration files as resources and exposes them through a typed API.

## Usage

Add the NuGet package to your project:

```xml
<PackageReference Include="Farsight.Chains" Version="1.0.1" />
```

Retrieve all chain metadata:

```csharp
using Farsight.Chains;

ChainMetadata[] chains = ChainRegistry.GetAllChains();
```

Each `ChainMetadata` record contains:

| Property | Type | Description |
|---|---|---|
| `Name` | `string` | Human-readable chain name |
| `CanReorg` | `bool` | Whether the chain can reorganize |
| `SupportsPriorityFees` | `bool` | Whether priority fees are supported |
| `SupportsGasRefunds` | `bool` | Whether gas refunds are supported |
| `BlockGasLimitM` | `ulong` | Block gas limit (in millions) |
| `NativeCurrency` | `NativeCurrency` | Native currency info (name, symbol, decimals, Pyth feed ID) |
| `FlashCallerAddress` | `Address` | Flash caller contract address |
| `StablecoinAddresses` | `ReadOnlyMemory<Address>` | Stablecoin contract addresses |
| `Api3` | `Api3Config?` | Optional API3 market contract address |
| `Pyth` | `PythConfig?` | Optional Pyth oracle contract address |

## Supported Chains

| Chain | Native Currency |
|---|---|
| Abstract | ETH |
| Arbitrum | ETH |
| Avalanche C-Chain | AVAX |
| BSquared | BTC |
| Base | ETH |
| Berachain | BERA |
| BSC | BNB |
| Celo | CELO |
| CoreDAO | CORE |
| Citrea | cBTC |
| CronosEVM | CRO |
| Ethereum | ETH |
| Flare | FLR |
| Flow | FLOW |
| Fraxtal | FRAX |
| Gnosis | xDAI |
| Hemi | ETH |
| HyperEVM | HYPE |
| Ink | ETH |
| Katana | ETH |
| Linea | ETH |
| Lisk | ETH |
| Mantle | MNT |
| MegaETH | ETH |
| Monad | MON |
| Moonbeam | GLMR |
| Optimism | ETH |
| Plasma | ETH |
| Plume | ETH |
| Polygon | POL |
| PulseChain | PLS |
| Rootstock | RBTC |
| Scroll | ETH |
| Sei | SEI |
| Sonic | S |
| Soneium | ETH |
| Swellchain | ETH |
| Unichain | ETH |
| Worldchain | ETH |

## Adding a New Chain

1. Create a JSON file in the `chains/` directory matching the schema of existing entries.
2. The file is automatically embedded as a resource and included via the `../chains/*.json` glob in the project file.
3. Rebuild the project — `ChainRegistry.GetAllChains()` will pick it up automatically.
