# Farsight.RPC.Sdk

Read-only SDK for loading RPC provider configuration from the Farsight RPC API service.

## Usage

```csharp
builder.AddFarsightRpcProviders(options =>
{
    options.ApiUrl = new Uri("https://rpc-providers.example/");
    options.ApiKey = "application-environment-scoped-api-key";
});

var providers = await serviceProvider
    .GetRequiredService<Farsight.RPC.Sdk.Client.IRpcProvidersClient>()
    .GetProvidersAsync("ethereum");

var rateLimits = await serviceProvider
    .GetRequiredService<Farsight.RPC.Sdk.Client.IRpcProvidersClient>()
    .GetRateLimitsAsync();
```
