using System.Security.Cryptography;
using System.Text;

namespace CompanyAPP.Services.Common;

public static class InviteToken
{
    public static string Create() => Convert.ToHexString(RandomNumberGenerator.GetBytes(32));

    public static string Hash(string token)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(token));
        return Convert.ToHexString(bytes);
    }

    public static bool Matches(string token, string? storedHash)
    {
        if (string.IsNullOrEmpty(storedHash) || string.IsNullOrEmpty(token)) return false;
        var actual = Hash(token);
        if (actual.Length != storedHash.Length) return false;
        return CryptographicOperations.FixedTimeEquals(
            Encoding.UTF8.GetBytes(actual),
            Encoding.UTF8.GetBytes(storedHash));
    }
}
