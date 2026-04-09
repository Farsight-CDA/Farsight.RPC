using Farsight.Rpc.Api.Configuration;
using Farsight.Rpc.Api.Services;
using FastEndpoints;

namespace Farsight.Rpc.Api.Endpoints.Auth.Login;

public sealed class POST(AdminAuthenticationService adminAuthenticationService, JwtConfiguration jwtConfiguration) : Endpoint<POST.Request, POST.Response>
{
    public sealed record Request(
        string Username,
        string Password
    );
    public new sealed record Response(
        string Token,
        string Username,
        DateTimeOffset ExpiresUtc
    );

    public override void Configure()
    {
        Post("/api/auth/login");
        AllowAnonymous();
    }

    public override async Task HandleAsync(Request req, CancellationToken ct)
    {
        if(!adminAuthenticationService.IsValidCredentials(req.Username, req.Password))
        {
            await Send.UnauthorizedAsync(ct);
            return;
        }

        var expiresUtc = DateTimeOffset.UtcNow.AddMinutes(jwtConfiguration.ExpiryMinutes);
        await Send.OkAsync(new Response(adminAuthenticationService.CreateToken(req.Username), req.Username, expiresUtc), ct);
    }
}
