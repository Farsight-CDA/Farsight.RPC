using Farsight.Rpc.Types;
using System.Security.Claims;

namespace Farsight.Rpc.Api.Auth;

public static class ApiClientClaimTypes
{
    public const string APPLICATION_ID = "farsight:rpc-providers:application-id";
    public const string ENVIRONMENT = "farsight:rpc-providers:environment";

    public static Guid GetRequiredApplicationId(ClaimsPrincipal principal)
        => Guid.Parse(principal.FindFirstValue(APPLICATION_ID) ?? throw new InvalidOperationException("Missing application scope claim."));

    public static HostEnvironment GetRequiredEnvironment(ClaimsPrincipal principal)
        => Enum.Parse<HostEnvironment>(principal.FindFirstValue(ENVIRONMENT) ?? throw new InvalidOperationException("Missing environment scope claim."), ignoreCase: true);
}
