using Farsight.Rpc.Api.Configuration;
using Farsight.Rpc.Api.Services;
using FastEndpoints;

namespace Farsight.Rpc.Api.Endpoints.Admin.Auth;

public sealed class AdminLoginEndpoint(AdminAuthenticationService adminAuthenticationService, JwtConfiguration jwtConfiguration) : Endpoint<AdminLoginEndpoint.Request, AdminLoginEndpoint.Response>
{
    public sealed class Request
    {
        public string UserName { get; set; } = String.Empty;

        public string Password { get; set; } = String.Empty;
    }

    public new sealed record Response(string Token, string UserName, DateTimeOffset ExpiresUtc);

    public override void Configure()
    {
        Post("/api/admin/auth/login");
        AllowAnonymous();
    }

    public override async Task HandleAsync(Request req, CancellationToken ct)
    {
        if(!adminAuthenticationService.IsValidCredentials(req.UserName, req.Password))
        {
            await Send.UnauthorizedAsync(ct);
            return;
        }

        var expiresUtc = DateTimeOffset.UtcNow.AddMinutes(jwtConfiguration.ExpiryMinutes);
        await Send.OkAsync(new Response(adminAuthenticationService.CreateToken(req.UserName), req.UserName, expiresUtc), ct);
    }
}
