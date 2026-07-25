using Farsight.Common;
using Farsight.Rpc.Api.Configuration;
using FastEndpoints.Security;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace Farsight.Rpc.Api.Auth;

public sealed partial class AuthenticationTokenService : Singleton
{
    public const string SECURITY_KEY_VERIFIED_CLAIM = "farsight:security_key_verified";

    [Inject]
    private readonly JwtConfiguration _jwtConfiguration;

    public sealed record AccessToken(string Token, DateTimeOffset ExpiresUtc);

    public AccessToken CreateAccessToken(string username, bool securityKeyVerified = false)
    {
        var expiresUtc = DateTimeOffset.UtcNow.AddMinutes(_jwtConfiguration.ExpiryMinutes);
        string token = JwtBearer.CreateToken(options =>
        {
            options.ExpireAt = expiresUtc.UtcDateTime;
            options.User.Roles.Add(AuthRoles.ADMIN);
            AddIdentityClaims(options.User.Claims, username);
            options.User.Claims.Add(new Claim(JwtRegisteredClaimNames.Amr, "pwd"));
            if(securityKeyVerified)
            {
                options.User.Claims.Add(new Claim(JwtRegisteredClaimNames.Amr, "fido2"));
                options.User.Claims.Add(new Claim(SECURITY_KEY_VERIFIED_CLAIM, Boolean.TrueString));
            }
        });

        return new AccessToken(token, expiresUtc);
    }

    private static void AddIdentityClaims(List<Claim> claims, string username)
    {
        claims.Add(new Claim(JwtRegisteredClaimNames.Sub, username));
        claims.Add(new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()));
        claims.Add(new Claim(ClaimTypes.NameIdentifier, AuthRoles.ADMIN));
        claims.Add(new Claim(ClaimTypes.Name, username));
    }
}
