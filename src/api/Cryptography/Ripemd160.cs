using System.Buffers.Binary;
using System.Numerics;

namespace Farsight.Rpc.Api.Cryptography;

internal static class Ripemd160
{
    public const int HASH_LENGTH = 20;
    public const int INPUT_LENGTH = 32;

    private static ReadOnlySpan<byte> LEFT_WORD_ORDER => [
         0,  1,  2,  3,  4,  5,  6,  7,  8,  9, 10, 11, 12, 13, 14, 15,
         7,  4, 13,  1, 10,  6, 15,  3, 12,  0,  9,  5,  2, 14, 11,  8,
         3, 10, 14,  4,  9, 15,  8,  1,  2,  7,  0,  6, 13, 11,  5, 12,
         1,  9, 11, 10,  0,  8, 12,  4, 13,  3,  7, 15, 14,  5,  6,  2,
         4,  0,  5,  9,  7, 12,  2, 10, 14,  1,  3,  8, 11,  6, 15, 13,
    ];

    private static ReadOnlySpan<byte> RIGHT_WORD_ORDER => [
         5, 14,  7,  0,  9,  2, 11,  4, 13,  6, 15,  8,  1, 10,  3, 12,
         6, 11,  3,  7,  0, 13,  5, 10, 14, 15,  8, 12,  4,  9,  1,  2,
        15,  5,  1,  3,  7, 14,  6,  9, 11,  8, 12,  2, 10,  0,  4, 13,
         8,  6,  4,  1,  3, 11, 15,  0,  5, 12,  2, 13,  9,  7, 10, 14,
        12, 15, 10,  4,  1,  5,  8,  7,  6,  2, 13, 14,  0,  3,  9, 11,
    ];

    private static ReadOnlySpan<byte> LEFT_ROTATIONS => [
        11, 14, 15, 12,  5,  8,  7,  9, 11, 13, 14, 15,  6,  7,  9,  8,
         7,  6,  8, 13, 11,  9,  7, 15,  7, 12, 15,  9, 11,  7, 13, 12,
        11, 13,  6,  7, 14,  9, 13, 15, 14,  8, 13,  6,  5, 12,  7,  5,
        11, 12, 14, 15, 14, 15,  9,  8,  9, 14,  5,  6,  8,  6,  5, 12,
         9, 15,  5, 11,  6,  8, 13, 12,  5, 12, 13, 14, 11,  8,  5,  6,
    ];

    private static ReadOnlySpan<byte> RIGHT_ROTATIONS => [
         8,  9,  9, 11, 13, 15, 15,  5,  7,  7,  8, 11, 14, 14, 12,  6,
         9, 13, 15,  7, 12,  8,  9, 11,  7,  7, 12,  7,  6, 15, 13, 11,
         9,  7, 15, 11,  8,  6,  6, 14, 12, 13,  5, 14, 13, 13,  7,  5,
        15,  5,  8, 11, 14, 14,  6, 14,  6,  9, 12,  9, 12,  5, 15,  8,
         8,  5, 12,  9, 12,  5, 14,  6,  8, 13,  6,  5, 15, 13, 11, 11,
    ];

    public static void Hash32(ReadOnlySpan<byte> input, Span<byte> destination)
    {
        if(input.Length != INPUT_LENGTH)
        {
            throw new ArgumentException($"RIPEMD-160 input must be {INPUT_LENGTH} bytes.", nameof(input));
        }
        if(destination.Length < HASH_LENGTH)
        {
            throw new ArgumentException($"RIPEMD-160 destination must be at least {HASH_LENGTH} bytes.", nameof(destination));
        }

        // A 32-byte message and its padding always fit in one RIPEMD-160 block.
        Span<uint> words = stackalloc uint[16];
        words.Clear();
        for(int i = 0; i < input.Length / sizeof(uint); i++)
        {
            words[i] = BinaryPrimitives.ReadUInt32LittleEndian(input[(i * sizeof(uint))..]);
        }
        words[8] = 0x80;
        words[14] = INPUT_LENGTH * 8;

        uint h0 = 0x67452301;
        uint h1 = 0xefcdab89;
        uint h2 = 0x98badcfe;
        uint h3 = 0x10325476;
        uint h4 = 0xc3d2e1f0;

        uint leftA = h0;
        uint leftB = h1;
        uint leftC = h2;
        uint leftD = h3;
        uint leftE = h4;
        uint rightA = h0;
        uint rightB = h1;
        uint rightC = h2;
        uint rightD = h3;
        uint rightE = h4;

        unchecked
        {
            for(int i = 0; i < 80; i++)
            {
                int round = i / 16;
                uint leftResult = BitOperations.RotateLeft(
                    leftA
                    + RoundFunction(round, leftB, leftC, leftD)
                    + words[LEFT_WORD_ORDER[i]]
                    + LeftConstant(round),
                    LEFT_ROTATIONS[i]) + leftE;
                leftA = leftE;
                leftE = leftD;
                leftD = BitOperations.RotateLeft(leftC, 10);
                leftC = leftB;
                leftB = leftResult;

                uint rightResult = BitOperations.RotateLeft(
                    rightA
                    + RoundFunction(4 - round, rightB, rightC, rightD)
                    + words[RIGHT_WORD_ORDER[i]]
                    + RightConstant(round),
                    RIGHT_ROTATIONS[i]) + rightE;
                rightA = rightE;
                rightE = rightD;
                rightD = BitOperations.RotateLeft(rightC, 10);
                rightC = rightB;
                rightB = rightResult;
            }

            uint combined = h1 + leftC + rightD;
            h1 = h2 + leftD + rightE;
            h2 = h3 + leftE + rightA;
            h3 = h4 + leftA + rightB;
            h4 = h0 + leftB + rightC;
            h0 = combined;
        }

        BinaryPrimitives.WriteUInt32LittleEndian(destination, h0);
        BinaryPrimitives.WriteUInt32LittleEndian(destination[4..], h1);
        BinaryPrimitives.WriteUInt32LittleEndian(destination[8..], h2);
        BinaryPrimitives.WriteUInt32LittleEndian(destination[12..], h3);
        BinaryPrimitives.WriteUInt32LittleEndian(destination[16..], h4);
    }

    private static uint RoundFunction(int round, uint x, uint y, uint z)
        => round switch
        {
            0 => x ^ y ^ z,
            1 => (x & y) | (~x & z),
            2 => (x | ~y) ^ z,
            3 => (x & z) | (y & ~z),
            4 => x ^ (y | ~z),
            _ => throw new ArgumentOutOfRangeException(nameof(round)),
        };

    private static uint LeftConstant(int round)
        => round switch
        {
            0 => 0x00000000,
            1 => 0x5a827999,
            2 => 0x6ed9eba1,
            3 => 0x8f1bbcdc,
            4 => 0xa953fd4e,
            _ => throw new ArgumentOutOfRangeException(nameof(round)),
        };

    private static uint RightConstant(int round)
        => round switch
        {
            0 => 0x50a28be6,
            1 => 0x5c4dd124,
            2 => 0x6d703ef3,
            3 => 0x7a6d76e9,
            4 => 0x00000000,
            _ => throw new ArgumentOutOfRangeException(nameof(round)),
        };
}
