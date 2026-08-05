using System.Text.Json;
using System.Text.Json.Serialization;

namespace Farsight.Rpc.Types;

public sealed class RpcCapabilityArrayJsonConverter : JsonConverter<RpcCapability[]>
{
    public override RpcCapability[] Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        if(reader.TokenType != JsonTokenType.StartArray)
        {
            throw new JsonException("Expected an array of RPC capabilities.");
        }

        var capabilities = new List<RpcCapability>();

        while(reader.Read())
        {
            if(reader.TokenType == JsonTokenType.EndArray)
            {
                return [.. capabilities];
            }

            RpcCapability? capability = reader.TokenType switch
            {
                JsonTokenType.String when Enum.TryParse(reader.GetString(), ignoreCase: true, out RpcCapability parsed)
                    && Enum.IsDefined(parsed) => parsed,
                JsonTokenType.Number when reader.TryGetInt32(out int numeric)
                    && Enum.IsDefined((RpcCapability) numeric) => (RpcCapability) numeric,
                JsonTokenType.String or JsonTokenType.Number => null,
                _ => throw new JsonException("RPC capabilities must be strings or integers."),
            };

            if(capability is { } knownCapability)
            {
                capabilities.Add(knownCapability);
            }
        }

        throw new JsonException("RPC capability array was incomplete.");
    }

    public override void Write(Utf8JsonWriter writer, RpcCapability[] value, JsonSerializerOptions options)
    {
        writer.WriteStartArray();
        foreach(var capability in value)
        {
            if(Enum.IsDefined(capability))
            {
                writer.WriteStringValue(capability.ToString());
            }
            else
            {
                writer.WriteNumberValue((int) capability);
            }
        }
        writer.WriteEndArray();
    }
}
