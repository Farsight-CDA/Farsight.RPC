using Farsight.Common;
using Farsight.Rpc.Api;
var builder = WebApplication.CreateBuilder(args);

builder.AddApplication<Startup>();
App.ConfigureHosting(builder);
App.ConfigureServices(builder);
App.ConfigureInstrumentation(builder);
App.ConfigureAuth(builder);

var app = builder.Build();
App.Configure(app);

await app.RunAsync();
