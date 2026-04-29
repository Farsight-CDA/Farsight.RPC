using EtherSharp.Common.Converter;
using System.Text.Json.Serialization;

namespace Farsight.Chains;

[JsonSourceGenerationOptions(Converters = [typeof(AddressConverter), typeof(Bytes32Converter)])]
[JsonSerializable(typeof(ChainMetadata))]
internal sealed partial class ChainsJsonContext : JsonSerializerContext
{
}
