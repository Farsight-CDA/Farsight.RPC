using System.Text.Json;
using System.Text.Json.Serialization;

namespace Farsight.Rpc.Types;

public static class FarsightRpcJson
{
    public static JsonSerializerOptions ConfigureJsonConverters(JsonSerializerOptions options)
    {
        options.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
        options.PropertyNameCaseInsensitive = true;
        options.Converters.Add(new JsonStringEnumConverter<RpcCapability>());
        options.Converters.Add(new JsonStringEnumConverter<RpcErrorAction>());
        return options;
    }
}
