using Farsight.RPC.Providers.Sdk.Client;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace Farsight.RPC.Providers.Sdk;

public static class DependencyInjection
{
    extension(IHostApplicationBuilder builder)
    {
        public IHostApplicationBuilder AddFarsightRpcProviders(Action<RpcProvidersOptions>? configureOptions = default)
        {
            builder.Services.AddSingleton(_ =>
            {
                var options = new RpcProvidersOptions();
                configureOptions?.Invoke(options);
                return RpcProvidersClientOptions.Create(options);
            });

            builder.Services.AddHttpClient<RpcProvidersClient>((provider, client) =>
            {
                var options = provider.GetRequiredService<RpcProvidersClientOptions>();
                client.BaseAddress = options.ApiUrl;

                if (!string.IsNullOrWhiteSpace(options.ApiKey))
                {
                    client.DefaultRequestHeaders.Remove(options.ApiKeyHeaderName);
                    client.DefaultRequestHeaders.Add(options.ApiKeyHeaderName, options.ApiKey);
                }
            });
            builder.Services.AddSingleton<IRpcProvidersClient, RpcProvidersClient>();
            return builder;
        }

        public IHostApplicationBuilder AddFarsightRpcProviders(Action<IServiceProvider, RpcProvidersOptions> configureOptions)
        {
            builder.Services.AddSingleton(sp =>
            {
                var options = new RpcProvidersOptions();
                configureOptions(sp, options);
                return RpcProvidersClientOptions.Create(options);
            });

            builder.Services.AddHttpClient<RpcProvidersClient>((provider, client) =>
            {
                var options = provider.GetRequiredService<RpcProvidersClientOptions>();
                client.BaseAddress = options.ApiUrl;

                if (!string.IsNullOrWhiteSpace(options.ApiKey))
                {
                    client.DefaultRequestHeaders.Remove(options.ApiKeyHeaderName);
                    client.DefaultRequestHeaders.Add(options.ApiKeyHeaderName, options.ApiKey);
                }
            });
            builder.Services.AddSingleton<IRpcProvidersClient, RpcProvidersClient>();
            return builder;
        }
    }
}
