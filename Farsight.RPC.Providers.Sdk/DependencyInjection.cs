using Farsight.RPC.Providers.Contracts;
using Farsight.RPC.Providers.Sdk.Client;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
namespace Farsight.RPC.Providers.Sdk;

public static class DependencyInjection
{
    internal const string HttpClientName = "Farsight.RPC.Providers";

    private sealed record RegistrationOptions(RpcProvidersOptions Options);

    extension(IHostApplicationBuilder builder)
    {
        public IHostApplicationBuilder AddFarsightRpcProviders(Action<RpcProvidersOptions>? configureOptions = default, Action<IHttpClientBuilder>? configureClient = default)
            => builder.AddFarsightRpcProviders((_, options) => configureOptions?.Invoke(options), configureClient);

        public IHostApplicationBuilder AddFarsightRpcProviders(Action<IServiceProvider, RpcProvidersOptions> configureOptions, Action<IHttpClientBuilder>? configureClient = default)
        {
            builder.Services.AddSingleton(sp =>
            {
                var options = new RpcProvidersOptions();
                configureOptions(sp, options);

                options.SerializerOptions ??= new System.Text.Json.JsonSerializerOptions(System.Text.Json.JsonSerializerDefaults.Web);

                return new RegistrationOptions(options);
            });

            var clientBuilder = builder.Services.AddHttpClient(HttpClientName, (sp, client) =>
            {
                var options = sp.GetRequiredService<RegistrationOptions>().Options;
                client.BaseAddress = options.ApiUrl;

                if(!String.IsNullOrWhiteSpace(options.ApiKey))
                {
                    client.DefaultRequestHeaders.Add(ApiKeyHeaders.ApiKey, options.ApiKey);
                }
            });

            configureClient?.Invoke(clientBuilder);

            builder.Services.AddSingleton<IRpcProvidersClient>(sp =>
                ActivatorUtilities.CreateInstance<RpcProvidersClient>(sp, sp.GetRequiredService<RegistrationOptions>().Options));

            return builder;
        }
    }
}
