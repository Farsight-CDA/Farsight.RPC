using Farsight.Common;
using System.ComponentModel.DataAnnotations;

namespace Farsight.Rpc.Api.Configuration;

[ConfigOption(SectionName = SECTION_NAME)]
public sealed class WalletEncryptionConfiguration
{
    public const string SECTION_NAME = "WalletEncryption";

    [Required]
    [RegularExpression("[0-9a-fA-F]{64}", ErrorMessage = "WalletEncryption:Key must be a 64-character hexadecimal string.")]
    public required string Key { get; init; }

    internal byte[] DecodeKey()
        => Convert.FromHexString(Key);
}
