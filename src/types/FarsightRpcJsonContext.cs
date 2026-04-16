using System.Text.Json.Serialization;

namespace Farsight.Rpc.Types;

[JsonSourceGenerationOptions(
    GenerationMode = JsonSourceGenerationMode.Metadata,
    DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
    PropertyNameCaseInsensitive = true,
    UseStringEnumConverter = true
)]
[JsonSerializable(typeof(ApiKeyRpcsDto))]
public partial class FarsightRpcJsonContext : JsonSerializerContext
{
}
