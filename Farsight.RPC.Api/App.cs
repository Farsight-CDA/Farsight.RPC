using Farsight.RPC.Api.Auth;
using Farsight.RPC.Api.Configuration;
using Farsight.RPC.Api.Models;
using Farsight.RPC.Api.Persistence;
using Farsight.RPC.Api.Validation;
using FastEndpoints;
using FluentValidation;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.DataProtection.KeyManagement;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using System.Net;

namespace Farsight.RPC.Api;

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

        builder.Services.AddRazorPages(options =>
        {
            options.Conventions.AuthorizeFolder("/");
            options.Conventions.AllowAnonymousToPage("/Login");
            options.Conventions.AllowAnonymousToPage("/Error");
        });

        builder.Services.AddFastEndpoints();
        builder.Services.AddHttpClient();

        builder.Services.AddSingleton<IConfigureOptions<KeyManagementOptions>, DataProtectionKeyManagementConfigurator>();
        builder.Services.AddDataProtection().SetApplicationName("Farsight.RPC.Api");

        builder.Services.AddDbContextFactory<RpcProvidersDbContext>((provider, options) =>
            options.UseNpgsql(provider.GetRequiredService<DatabaseConfiguration>().PostgresConnectionString));

        builder.Services.AddScoped<IValidator<ProviderEditModel>, ProviderEditModelValidator>();
        builder.Services.AddScoped<IValidator<ProbeRequest>, ProbeRequestValidator>();

        builder.Services.AddAuthentication(options =>
            {
                options.DefaultScheme = CookieAuthenticationDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = CookieAuthenticationDefaults.AuthenticationScheme;
            })
            .AddCookie(options =>
            {
                options.LoginPath = "/Login";
                options.AccessDeniedPath = "/Login";
            })
            .AddScheme<ApiKeyAuthenticationOptions, ApiKeyAuthenticationHandler>(ApiKeyAuthenticationDefaults.SCHEME, _ => { });

        builder.Services.AddAuthorizationBuilder()
            .AddPolicy(AuthorizationPolicies.ADMIN_ONLY, policy =>
            {
                policy.AddAuthenticationSchemes(CookieAuthenticationDefaults.AuthenticationScheme);
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
            app.UseExceptionHandler("/Error");
            app.UseHsts();
        }

        app.UseForwardedHeaders();

        if(!String.IsNullOrWhiteSpace(app.Environment.WebRootPath) && Directory.Exists(app.Environment.WebRootPath))
        {
            app.UseStaticFiles();
        }

        app.UseRouting();
        app.UseAuthentication();
        app.UseAuthorization();
        app.UseFastEndpoints();
        app.MapRazorPages();
    }
}
