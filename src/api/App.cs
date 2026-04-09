using Farsight.Rpc.Api.Auth;
using Farsight.Rpc.Api.Configuration;
using Farsight.Rpc.Api.Models;
using Farsight.Rpc.Api.Persistence;
using Farsight.Rpc.Api.Validation;
using FastEndpoints;
using FluentValidation;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Net;
using System.Text;

namespace Farsight.Rpc.Api;

public static class App
{
    public static void ConfigureServices(WebApplicationBuilder builder)
    {
        var bindingConfiguration = builder.Configuration
            .GetRequiredSection("ApiBinding")
            .Get<ApiBindingConfiguration>() ?? throw new InvalidOperationException("The ApiBinding configuration section is required.");

        builder.WebHost.ConfigureKestrel(x =>
        {
            if(String.Equals(bindingConfiguration.ListeningAddress, "localhost", StringComparison.OrdinalIgnoreCase))
            {
                x.ListenLocalhost(bindingConfiguration.Port);
                return;
            }

            if(!IPAddress.TryParse(bindingConfiguration.ListeningAddress, out var address))
            {
                throw new InvalidOperationException($"ApiBinding:ListeningAddress '{bindingConfiguration.ListeningAddress}' must be 'localhost' or a valid IP address.");
            }

            x.Listen(address, bindingConfiguration.Port);
        });

        builder.Services.AddFastEndpoints();
        builder.Services.AddProblemDetails();

        builder.Services.AddDbContext<RpcProvidersDbContext>((provider, options) =>
            options.UseNpgsql(provider.GetRequiredService<DatabaseConfiguration>().PostgresConnectionString));

        builder.Services.AddScoped<IValidator<ProviderEditModel>, ProviderEditModelValidator>();

        var jwtConfiguration = builder.Configuration
            .GetRequiredSection(JwtConfiguration.SECTION_NAME)
            .Get<JwtConfiguration>() ?? throw new InvalidOperationException("The Jwt configuration section is required.");
        byte[] signingKey = Encoding.UTF8.GetBytes(jwtConfiguration.Secret);

        builder.Services.AddAuthentication(options =>
            {
                options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            })
            .AddJwtBearer(options => options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidIssuer = jwtConfiguration.Issuer,
                ValidateAudience = true,
                ValidAudience = jwtConfiguration.Audience,
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(signingKey),
                ValidateLifetime = true,
                ClockSkew = TimeSpan.FromMinutes(1)
            })
            .AddScheme<ApiKeyAuthenticationOptions, ApiKeyAuthenticationHandler>(ApiKeyAuthenticationDefaults.SCHEME, _ => { });

        builder.Services.AddAuthorizationBuilder()
            .AddPolicy(AuthorizationPolicies.ADMIN_ONLY, policy =>
            {
                policy.AddAuthenticationSchemes(JwtBearerDefaults.AuthenticationScheme);
                policy.RequireAuthenticatedUser();
                policy.RequireRole(AppRoles.ADMIN);
            })
            .AddPolicy(AuthorizationPolicies.VIEWER_ONLY, policy =>
            {
                policy.AddAuthenticationSchemes(ApiKeyAuthenticationDefaults.SCHEME);
                policy.RequireAuthenticatedUser();
                policy.RequireRole(AppRoles.VIEWER);
            });

        builder.Services.Configure<ForwardedHeadersOptions>(options =>
        {
            options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto | ForwardedHeaders.XForwardedHost;
            options.KnownIPNetworks.Clear();
            options.KnownProxies.Clear();
        });
    }

    public static void Configure(WebApplication app)
    {
        if(!app.Environment.IsDevelopment())
        {
            app.UseExceptionHandler();
            app.UseHsts();
        }

        app.UseForwardedHeaders();

        app.UseRouting();
        app.UseAuthentication();
        app.UseAuthorization();
        app.UseFastEndpoints();
    }
}
