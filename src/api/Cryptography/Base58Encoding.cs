namespace Farsight.Rpc.Api.Cryptography;

internal static class Base58Encoding
{
    private const string ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
    private const int MAX_INPUT_LENGTH = 32;

    public static string Encode(ReadOnlySpan<byte> data)
    {
        if(data.IsEmpty)
        {
            return String.Empty;
        }
        if(data.Length > MAX_INPUT_LENGTH)
        {
            throw new ArgumentException($"Base58 input cannot exceed {MAX_INPUT_LENGTH} bytes.", nameof(data));
        }

        Span<byte> input = stackalloc byte[data.Length];
        data.CopyTo(input);

        int leadingZeroCount = 0;
        while(leadingZeroCount < input.Length && input[leadingZeroCount] == 0)
        {
            leadingZeroCount++;
        }

        Span<char> encoded = stackalloc char[data.Length * 2];
        int outputStart = encoded.Length;
        int inputStart = leadingZeroCount;

        while(inputStart < input.Length)
        {
            encoded[--outputStart] = ALPHABET[DivideBy58(input, inputStart)];
            if(input[inputStart] == 0)
            {
                inputStart++;
            }
        }

        while(outputStart < encoded.Length && encoded[outputStart] == ALPHABET[0])
        {
            outputStart++;
        }
        while(leadingZeroCount-- > 0)
        {
            encoded[--outputStart] = ALPHABET[0];
        }

        return new string(encoded[outputStart..]);
    }

    private static int DivideBy58(Span<byte> number, int start)
    {
        int remainder = 0;
        for(int i = start; i < number.Length; i++)
        {
            int value = (remainder * 256) + number[i];
            number[i] = (byte) (value / 58);
            remainder = value % 58;
        }

        return remainder;
    }
}
