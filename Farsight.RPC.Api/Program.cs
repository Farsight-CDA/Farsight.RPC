using Farsight.Common;
using Farsight.RPC.Api;
var builder = WebApplication.CreateBuilder(args);

builder.AddApplication<Startup>();
App.ConfigureServices(builder);

var app = builder.Build();
App.Configure(app);

await app.RunAsync();
