using Farsight.Rpc.Api.Auth;
using Farsight.Rpc.Api.Configuration;
using Farsight.Rpc.Api.Persistence;
using FastEndpoints;
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

        builder.Services.AddDbContext<AppDbContext>((provider, options) =>
            options.UseNpgsql(provider.GetRequiredService<DatabaseConfiguration>().PostgresConnectionString));

        builder.Services.Configure<ForwardedHeadersOptions>(options =>
        {
            options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto | ForwardedHeaders.XForwardedHost;
            options.KnownIPNetworks.Clear();
            options.KnownProxies.Clear();
        });
    }

    public static void ConfigureAuth(WebApplicationBuilder builder)
    {
        builder.Services.AddTransient<SymmetricSecurityKey>(provider =>
            new(Encoding.UTF8.GetBytes(provider.GetRequiredService<JwtConfiguration>().Secret)));

        builder.Services.AddAuthentication(options =>
            {
                options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            })
            .AddJwtBearer();

        builder.Services.AddOptions<JwtBearerOptions>(JwtBearerDefaults.AuthenticationScheme)
            .Configure<JwtConfiguration, SymmetricSecurityKey>((options, jwtConfiguration, signingKey) => options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidIssuer = jwtConfiguration.Issuer,
                ValidateAudience = true,
                ValidAudience = jwtConfiguration.Audience,
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = signingKey,
                ValidateLifetime = true,
                ClockSkew = TimeSpan.FromMinutes(1)
            });

        builder.Services.AddAuthorizationBuilder()
            .AddPolicy(AuthPolicies.ADMIN_ONLY, policy =>
            {
                policy.AddAuthenticationSchemes(JwtBearerDefaults.AuthenticationScheme);
                policy.RequireAuthenticatedUser();
                policy.RequireRole(AuthRoles.ADMIN);
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
