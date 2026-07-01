using System.Collections.Immutable;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Text.Json;

namespace Farsight.Chains;

/// <summary>
/// Provides access to embedded chain metadata resources.
/// </summary>
public static class ChainRegistry
{
    private static readonly Assembly _assembly = typeof(ChainRegistry).Assembly;

    /// <summary>
    /// Returns metadata for all chains embedded in the assembly.
    /// </summary>
    public static ImmutableArray<ChainMetadata> Chains { get; } = ImmutableCollectionsMarshal.AsImmutableArray(GetAllChains());

    /// <summary>
    /// Checks if the given chain name matches a registered chain in the registry.
    /// </summary>
    /// <param name="chainName"></param>
    /// <returns></returns>
    public static bool IsRegisteredChain(string chainName)
        => Chains.Any(x => x.Name.Equals(chainName, StringComparison.OrdinalIgnoreCase));

    private static ChainMetadata[] GetAllChains()
    {
        string? @namespace = typeof(ChainRegistry).Namespace ?? throw new InvalidOperationException("Missing ChainRegistry Namespace");
        string[] resourceNames = [.. _assembly.GetManifestResourceNames().Where(name => name.StartsWith(@namespace) && name.EndsWith(".json"))];

        var chains = new ChainMetadata[resourceNames.Length];

        for(int i = 0; i < resourceNames.Length; i++)
        {
            string ressourceName = resourceNames[i];

            using var stream = _assembly.GetManifestResourceStream(ressourceName)
                ?? throw new InvalidOperationException($"Embedded chain resource '{ressourceName}' was not found.");

            chains[i] = JsonSerializer.Deserialize(stream, ChainsJsonContext.Default.ChainMetadata)
                ?? throw new InvalidOperationException($"Resource '{ressourceName}' could not be deserialized.");
        }

        return chains;
    }
}
