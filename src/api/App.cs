using Farsight.Rpc.Api.Configuration;
using Farsight.Rpc.Api.Persistence;
using Farsight.Rpc.Types;
using FastEndpoints;
using FastEndpoints.Security;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Net;

namespace Farsight.Rpc.Api;

public static class App
{
    public static void ConfigureHosting(WebApplicationBuilder builder)
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
    }

    public static void ConfigureServices(WebApplicationBuilder builder)
    {
        builder.Services.AddFastEndpoints();
        builder.Services.AddProblemDetails();

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
        var jwtConfiguration = builder.Configuration
            .GetRequiredSection(JwtConfiguration.SECTION_NAME)
            .Get<JwtConfiguration>() ?? throw new InvalidOperationException("The Jwt configuration section is required.");

        builder.Services.AddOptions<JwtCreationOptions>()
            .Configure(options =>
            {
                options.SigningKey = jwtConfiguration.Secret;
                options.Issuer = jwtConfiguration.Issuer;
                options.Audience = jwtConfiguration.Audience;
            });

        builder.Services
            .AddAuthenticationJwtBearer(
                signingOptions => signingOptions.SigningKey = jwtConfiguration.Secret,
                bearerOptions =>
                {
                    var tokenValidationParameters = bearerOptions.TokenValidationParameters ??= new TokenValidationParameters();
                    tokenValidationParameters.ValidateIssuer = true;
                    tokenValidationParameters.ValidIssuer = jwtConfiguration.Issuer;
                    tokenValidationParameters.ValidateAudience = true;
                    tokenValidationParameters.ValidAudience = jwtConfiguration.Audience;
                    tokenValidationParameters.ValidateIssuerSigningKey = true;
                    tokenValidationParameters.ValidateLifetime = true;
                    tokenValidationParameters.ClockSkew = TimeSpan.FromMinutes(1);
                })
            .AddAuthorization();
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
        app.UseFastEndpoints(x =>
        {
            FarsightRpcJson.ConfigureJsonConverters(x.Serializer.Options);
        });
    }
}
