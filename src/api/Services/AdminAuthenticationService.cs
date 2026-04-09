using Farsight.Common;
using Farsight.Rpc.Api.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace Farsight.Rpc.Api.Services;

public partial class AdminAuthenticationService : Singleton
{
    [Inject] private readonly AdminLoginConfiguration _adminLoginOptions;
    [Inject] private readonly JwtConfiguration _jwtConfiguration;

    public bool IsValidCredentials(string userName, string password)
        => IsValidUserName(userName) && IsValidPassword(password);

    public string CreateToken(string userName)
    {
        var now = DateTimeOffset.UtcNow;
        byte[] keyBytes = Encoding.UTF8.GetBytes(_jwtConfiguration.Secret);
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, userName),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new(ClaimTypes.NameIdentifier, AppRoles.ADMIN),
            new(ClaimTypes.Name, userName),
            new(ClaimTypes.Role, AppRoles.ADMIN)
        };

        var token = new JwtSecurityToken(
            issuer: _jwtConfiguration.Issuer,
            audience: _jwtConfiguration.Audience,
            claims: claims,
            notBefore: now.UtcDateTime,
            expires: now.AddMinutes(_jwtConfiguration.ExpiryMinutes).UtcDateTime,
            signingCredentials: new SigningCredentials(new SymmetricSecurityKey(keyBytes), SecurityAlgorithms.HmacSha256)
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private bool IsValidPassword(string password)
    {
        byte[] providedPassword = Encoding.UTF8.GetBytes(password);
        byte[] configuredPassword = Encoding.UTF8.GetBytes(_adminLoginOptions.Password);
        return providedPassword.Length == configuredPassword.Length
            && CryptographicOperations.FixedTimeEquals(providedPassword, configuredPassword);
    }

    private bool IsValidUserName(string userName)
        => String.Equals(userName, _adminLoginOptions.User, StringComparison.Ordinal);
}
