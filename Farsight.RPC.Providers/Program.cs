using Farsight.Common;
using Farsight.RPC.Providers;
var builder = WebApplication.CreateBuilder(args);

builder.AddApplication<Startup>();
App.ConfigureServices(builder);

var app = builder.Build();
App.Configure(app);

await app.RunAsync();
