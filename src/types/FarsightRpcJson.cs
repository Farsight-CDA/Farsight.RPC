using System.Text.Json;
using System.Text.Json.Serialization;

namespace Farsight.Rpc.Types;

public static class FarsightRpcJson
{
    public static JsonSerializerOptions ConfigureJsonConverters(JsonSerializerOptions options)
    {
        options.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
        options.PropertyNameCaseInsensitive = true;
        options.Converters.Add(new JsonStringEnumConverter<TracingMode>());
        options.Converters.Add(new JsonStringEnumConverter<RpcType>());
        options.Converters.Add(new JsonStringEnumConverter<RpcStructureType>());
        options.Converters.Add(new JsonStringEnumConverter<RpcErrorAction>());
        return options;
    }
}
