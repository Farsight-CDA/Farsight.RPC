using System.Text;

namespace Farsight.Rpc.Api.Cryptography;

// Adapted from Cosm.Net's Bech32 encoder.
internal static class Bech32Encoding
{
    private const int CHECKSUM_LENGTH = 6;
    private const string CHARSET = "qpzry9x8gf2tvdw0s3jn54khce6mua7l";

    private static readonly uint[] _generator =
        [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];

    public static string Encode(string prefix, ReadOnlySpan<byte> data)
    {
        int outputSize = (data.Length * 8 / 5)
            + ((data.Length * 8 % 5) != 0 ? 1 : 0);
        Span<byte> buffer = stackalloc byte[outputSize + CHECKSUM_LENGTH];

        if(SquashBytes(data, buffer[..^CHECKSUM_LENGTH]) != outputSize)
        {
            throw new InvalidOperationException("Failed to encode Bech32 address.");
        }

        CreateChecksum(prefix, buffer[..^CHECKSUM_LENGTH], buffer[^CHECKSUM_LENGTH..]);

        var builder = new StringBuilder(prefix.Length + 1 + buffer.Length);
        _ = builder.Append(prefix);
        _ = builder.Append('1');

        foreach(byte value in buffer)
        {
            if((value & 0xe0) != 0)
            {
                throw new InvalidOperationException("Invalid Bech32 value.");
            }

            _ = builder.Append(CHARSET[value]);
        }

        return builder.ToString();
    }

    private static uint PolyMod(ReadOnlySpan<byte> data)
    {
        uint checksum = 1;
        foreach(byte value in data)
        {
            uint top = checksum >> 25;
            checksum = ((checksum & 0x1ffffff) << 5) ^ value;
            for(int i = 0; i < 5; i++)
            {
                if(((top >> i) & 1) == 1)
                {
                    checksum ^= _generator[i];
                }
            }
        }

        return checksum;
    }

    private static int SquashBytes(ReadOnlySpan<byte> input, Span<byte> output)
    {
        int outputSize = (input.Length * 8 / 5)
            + ((input.Length * 8 % 5) != 0 ? 1 : 0);
        if(output.Length != outputSize)
        {
            return -1;
        }

        int accumulator = 0;
        int bitsStashed = 0;
        int outputIndex = 0;

        foreach(byte value in input)
        {
            accumulator = (accumulator << 8) | value;

            if(bitsStashed >= 2)
            {
                output[outputIndex] = (byte) ((accumulator >> (bitsStashed + 3)) & 31);
                output[outputIndex + 1] = (byte) ((accumulator >> (bitsStashed - 2)) & 31);
                bitsStashed -= 2;
                outputIndex += 2;
            }
            else
            {
                output[outputIndex] = (byte) ((accumulator >> (bitsStashed + 3)) & 31);
                bitsStashed += 3;
                outputIndex++;
            }
        }

        if(bitsStashed != 0)
        {
            output[outputIndex] = (byte) ((accumulator << (5 - bitsStashed)) & 31);
        }

        return outputSize;
    }

    private static void ExpandPrefix(ReadOnlySpan<char> prefix, Span<byte> output)
    {
        for(int i = 0; i < prefix.Length; i++)
        {
            output[i] = (byte) (prefix[i] >> 5);
            output[i + prefix.Length + 1] = (byte) (prefix[i] & 0x1f);
        }

        output[prefix.Length] = 0;
    }

    private static void CreateChecksum(
        string prefix,
        ReadOnlySpan<byte> data,
        Span<byte> checksumOutput)
    {
        Span<byte> buffer = stackalloc byte[(prefix.Length * 2) + 1 + data.Length + CHECKSUM_LENGTH];
        ExpandPrefix(prefix, buffer);
        data.CopyTo(buffer[((prefix.Length * 2) + 1)..]);

        uint checksum = PolyMod(buffer) ^ 1;
        for(int i = 0; i < CHECKSUM_LENGTH; i++)
        {
            checksumOutput[i] = (byte) ((checksum >> (5 * (5 - i))) & 0x1f);
        }
    }
}
