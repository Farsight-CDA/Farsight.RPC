using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace Farsight.RPC.Providers.Sdk;

public static class RpcProvidersServiceCollectionExtensions
{
    public static WebApplicationBuilder AddFarsightRpcProviders(this WebApplicationBuilder builder, Action<RpcProvidersClientOptions> configure)
    {
        builder.Services.AddFarsightRpcProviders(configure);
        return builder;
    }

    public static IServiceCollection AddFarsightRpcProviders(this IServiceCollection services, Action<RpcProvidersClientOptions> configure)
    {
        services.Configure(configure);
        services.AddHttpClient<IRpcProvidersClient, RpcProvidersClient>((provider, client) =>
        {
            var options = provider.GetRequiredService<IOptions<RpcProvidersClientOptions>>().Value;
            if (options.ApiUrl is null)
            {
                throw new InvalidOperationException("Farsight RPC Providers ApiUrl must be configured.");
            }

            client.BaseAddress = options.ApiUrl;

            if (!string.IsNullOrWhiteSpace(options.ApiKey))
            {
                client.DefaultRequestHeaders.Remove(options.ApiKeyHeaderName);
                client.DefaultRequestHeaders.Add(options.ApiKeyHeaderName, options.ApiKey);
            }
        });

        return services;
    }
}
