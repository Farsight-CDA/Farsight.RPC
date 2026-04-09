using System.Text.Json;
using System.Text.Json.Serialization;

namespace Farsight.Rpc.Types;

public static class FarsightRpcJson
{
    public static JsonSerializerOptions Default { get; } = ConfigureJsonConverters(new JsonSerializerOptions());

    public static JsonSerializerOptions ConfigureJsonConverters(JsonSerializerOptions options)
    {
        options.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
        options.Converters.Add(new JsonStringEnumConverter());
        options.PropertyNameCaseInsensitive = true;
        return options;
    }
}
