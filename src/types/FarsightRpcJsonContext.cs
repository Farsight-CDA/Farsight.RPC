using EtherSharp.Common.Converter;
using System.Text.Json.Serialization;

namespace Farsight.Rpc.Types;

[JsonSourceGenerationOptions(
    GenerationMode = JsonSourceGenerationMode.Metadata,
    DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
    PropertyNameCaseInsensitive = true,
    UseStringEnumConverter = true,
    Converters = [typeof(HexStringByteArrayConverter)]
)]
[JsonSerializable(typeof(ApiKeyRpcsDto))]
[JsonSerializable(typeof(RpcProbeResult))]
[JsonSerializable(typeof(WalletInfoDto))]
[JsonSerializable(typeof(WalletSignRequestDto))]
[JsonSerializable(typeof(WalletSignResponseDto))]
public partial class FarsightRpcJsonContext : JsonSerializerContext
{
}
