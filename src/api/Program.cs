using Farsight.Common;
using Farsight.Rpc.Api;
var builder = WebApplication.CreateBuilder(args);

builder.AddApplication<Startup>();

builder.Host.ConfigureHostOptions(x =>
{
    x.BackgroundServiceExceptionBehavior = BackgroundServiceExceptionBehavior.StopHost;
    x.StartupTimeout = TimeSpan.FromSeconds(30);
    x.ShutdownTimeout = TimeSpan.FromSeconds(5);
});

App.ConfigureConfiguration(builder);
App.ConfigureHosting(builder);
App.ConfigureServices(builder);
App.ConfigureInstrumentation(builder);
App.ConfigureAuth(builder);

var app = builder.Build();
App.Configure(app);

await app.RunAsync();
