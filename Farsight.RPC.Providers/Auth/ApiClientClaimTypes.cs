using Farsight.RPC.Providers.Contracts;
using System.Security.Claims;

namespace Farsight.RPC.Providers.Auth;

public static class ApiClientClaimTypes
{
    public const string ApplicationId = "farsight:rpc-providers:application-id";
    public const string Environment = "farsight:rpc-providers:environment";

    public static Guid GetRequiredApplicationId(ClaimsPrincipal principal)
        => Guid.Parse(principal.FindFirstValue(ApplicationId) ?? throw new InvalidOperationException("Missing application scope claim."));

    public static HostEnvironment GetRequiredEnvironment(ClaimsPrincipal principal)
        => Enum.Parse<HostEnvironment>(principal.FindFirstValue(Environment) ?? throw new InvalidOperationException("Missing environment scope claim."), ignoreCase: true);
}
