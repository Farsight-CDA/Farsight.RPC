using Farsight.Common;
using Farsight.Rpc.Api.Auth;
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

    private SigningCredentials _jwtCredentials = null!;

    protected override Task SetupAsync(CancellationToken cancellationToken)
    {
        byte[] key = Encoding.UTF8.GetBytes(_jwtConfiguration.Secret);
        _jwtCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256);
        return Task.CompletedTask;
    }

    public bool IsValidCredentials(string userName, string password)
        => IsValidUserName(userName) && IsValidPassword(password);

    private bool IsValidPassword(string password)
    {
        byte[] providedPassword = Encoding.UTF8.GetBytes(password);
        byte[] configuredPassword = Encoding.UTF8.GetBytes(_adminLoginOptions.Password);
        return providedPassword.Length == configuredPassword.Length
            && CryptographicOperations.FixedTimeEquals(providedPassword, configuredPassword);
    }

    private bool IsValidUserName(string userName)
        => userName == _adminLoginOptions.User;

    public string CreateToken(string userName)
    {
        var now = DateTimeOffset.UtcNow;
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, userName),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new(ClaimTypes.NameIdentifier, AuthRoles.ADMIN),
            new(ClaimTypes.Name, userName),
            new(ClaimTypes.Role, AuthRoles.ADMIN)
        };

        var token = new JwtSecurityToken(
            issuer: _jwtConfiguration.Issuer,
            audience: _jwtConfiguration.Audience,
            claims: claims,
            notBefore: now.UtcDateTime,
            expires: now.AddMinutes(_jwtConfiguration.ExpiryMinutes).UtcDateTime,
            signingCredentials: _jwtCredentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
