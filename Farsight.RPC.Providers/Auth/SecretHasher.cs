using System.Security.Cryptography;
using System.Text;

namespace Farsight.RPC.Providers.Auth;

public static class SecretHasher
{
    public static string Hash(string input)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(input));
        return Convert.ToHexString(bytes);
    }
}
