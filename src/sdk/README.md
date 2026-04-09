# Farsight.Rpc.Sdk

Read-only SDK for loading RPC provider configuration from the Farsight RPC API service.

## Usage

```csharp
builder.AddFarsightRpc(options =>
{
    options.ApiUrl = new Uri("https://rpc-providers.example/");
    options.ApiKey = "application-environment-scoped-api-key";
});

var result = await serviceProvider
    .GetRequiredService<Farsight.Rpc.Sdk.Client.IFarsightRpcClient>()
    .GetRpcsAsync();

if(result is Farsight.Rpc.Sdk.Client.IFarsightRpcClient.GetRpcsResult.Success success)
{
    foreach(var (chain, rpcs) in success.Rpcs)
    {
        foreach(var rpc in rpcs)
        {
            Console.WriteLine($"{chain}: {rpc.Address}");
        }
    }
}
```
