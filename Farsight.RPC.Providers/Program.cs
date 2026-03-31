using FastEndpoints;
using Farsight.RPC.Providers;
using Farsight.RPC.Providers.Auth;
using Farsight.RPC.Providers.Data;
using Farsight.RPC.Providers.Services;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.Configure<BootstrapAdminOptions>(builder.Configuration.GetSection(BootstrapAdminOptions.SectionName));
builder.Services.Configure<BootstrapViewerClientOptions>(builder.Configuration.GetSection(BootstrapViewerClientOptions.SectionName));
builder.Services.AddRazorPages(options =>
{
    options.Conventions.AuthorizeFolder("/");
    options.Conventions.AllowAnonymousToPage("/Login");
    options.Conventions.AllowAnonymousToPage("/Error");
});
builder.Services.AddFastEndpoints();
builder.Services.AddHttpClient();
builder.Services.AddDbContext<RpcProvidersDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));
builder.Services.AddScoped<ProviderQueryService>();
builder.Services.AddScoped<AdminAuthenticationService>();
builder.Services.AddScoped<ProviderAdminService>();
builder.Services.AddScoped<RpcProbeService>();
builder.Services.AddScoped<DbInitializer>();
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
    .AddScheme<ApiKeyAuthenticationOptions, ApiKeyAuthenticationHandler>(ApiKeyAuthenticationDefaults.Scheme, _ => { });
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy(AuthorizationPolicies.AdminOnly, policy =>
    {
        policy.AddAuthenticationSchemes(CookieAuthenticationDefaults.AuthenticationScheme);
        policy.RequireAuthenticatedUser();
        policy.RequireRole(AppRoles.Admin);
    });

    options.AddPolicy(AuthorizationPolicies.ViewerOnly, policy =>
    {
        policy.AddAuthenticationSchemes(ApiKeyAuthenticationDefaults.Scheme);
        policy.RequireAuthenticatedUser();
        policy.RequireRole(AppRoles.Viewer);
    });
});

var app = builder.Build();

if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Error");
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseRouting();
app.UseAuthentication();
app.UseAuthorization();
app.UseFastEndpoints();
app.MapRazorPages();

using (var scope = app.Services.CreateScope())
{
    var initializer = scope.ServiceProvider.GetRequiredService<DbInitializer>();
    await initializer.InitializeAsync(app.Environment, app.Logger, CancellationToken.None);
}

await app.RunAsync();
