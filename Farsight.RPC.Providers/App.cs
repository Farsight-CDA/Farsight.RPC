using Farsight.RPC.Providers.Auth;
using Farsight.RPC.Providers.Models;
using Farsight.RPC.Providers.Persistence;
using Farsight.RPC.Providers.Validation;
using FastEndpoints;
using FluentValidation;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.EntityFrameworkCore;

namespace Farsight.RPC.Providers;

public static class App
{
    public static void ConfigureServices(WebApplicationBuilder builder)
    {
        builder.Services.AddRazorPages(options =>
        {
            options.Conventions.AuthorizeFolder("/");
            options.Conventions.AllowAnonymousToPage("/Login");
            options.Conventions.AllowAnonymousToPage("/Error");
        });

        builder.Services.AddFastEndpoints();
        builder.Services.AddHttpClient();

        string dataProtectionKeysDirectory = builder.Configuration["DataProtection:KeysDirectory"]
            ?? Environment.GetEnvironmentVariable("DataProtection__KeysDirectory")
            ?? "/var/lib/farsight-rpc-providers/data-protection";
        Directory.CreateDirectory(dataProtectionKeysDirectory);

        builder.Services.AddDataProtection()
            .SetApplicationName("Farsight.RPC.Providers")
            .PersistKeysToFileSystem(new DirectoryInfo(dataProtectionKeysDirectory));

        builder.Services.AddDbContextFactory<RpcProvidersDbContext>(options =>
            options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

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
        bool hasHttpsPortConfigured = !String.IsNullOrWhiteSpace(app.Configuration["HTTPS_PORTS"])
            || !String.IsNullOrWhiteSpace(app.Configuration["ASPNETCORE_HTTPS_PORTS"])
            || !String.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable("HTTPS_PORTS"))
            || !String.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable("ASPNETCORE_HTTPS_PORTS"));

        if(!app.Environment.IsDevelopment())
        {
            app.UseExceptionHandler("/Error");
            app.UseHsts();
        }

        app.UseForwardedHeaders();
        if(hasHttpsPortConfigured)
        {
            app.UseHttpsRedirection();
        }

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
