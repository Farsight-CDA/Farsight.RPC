using Farsight.RPC.Types;
using Farsight.RPC.Sdk.Client;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
namespace Farsight.RPC.Sdk;

public static class DependencyInjection
{
    internal const string HTTP_CLIENT_NAME = "Farsight.RPC.Api";

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

            var clientBuilder = builder.Services.AddHttpClient(HTTP_CLIENT_NAME, (sp, client) =>
            {
                var options = sp.GetRequiredService<RegistrationOptions>().Options;
                client.BaseAddress = options.ApiUrl;

                if(!String.IsNullOrWhiteSpace(options.ApiKey))
                {
                    client.DefaultRequestHeaders.Add(ApiKeyHeaders.API_KEY, options.ApiKey);
                }
            });

            configureClient?.Invoke(clientBuilder);

            builder.Services.AddSingleton<IRpcProvidersClient>(sp =>
                ActivatorUtilities.CreateInstance<RpcProvidersClient>(sp, sp.GetRequiredService<RegistrationOptions>().Options));

            return builder;
        }
    }
}
