# Farsight.RPC.Providers.Sdk

Read-only SDK for loading RPC provider configuration from the Farsight RPC Providers service.

## Usage

```csharp
builder.AddFarsightRpcProviders(options =>
{
    options.ApiUrl = new Uri("https://rpc-providers.example/");
    options.ApiKey = "viewer-api-key";
});
```
