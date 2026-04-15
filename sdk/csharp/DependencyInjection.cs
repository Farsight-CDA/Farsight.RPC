using Farsight.Rpc.Sdk.Client;
using Farsight.Rpc.Types;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
namespace Farsight.Rpc.Sdk;

public static class DependencyInjection
{
    internal const string HTTP_CLIENT_NAME = "Farsight.Rpc.Api";

    private sealed record RegistrationOptions(
        FarsightRpcOptions Options
    );

    extension(IHostApplicationBuilder builder)
    {
        public IHostApplicationBuilder AddFarsightRpc(Action<FarsightRpcOptions>? configureOptions = default, Action<IHttpClientBuilder>? configureClient = default)
            => builder.AddFarsightRpc((_, options) => configureOptions?.Invoke(options), configureClient);

        public IHostApplicationBuilder AddFarsightRpc(Action<IServiceProvider, FarsightRpcOptions> configureOptions, Action<IHttpClientBuilder>? configureClient = default)
        {
            builder.Services.AddSingleton(sp =>
            {
                var options = new FarsightRpcOptions();
                configureOptions(sp, options);

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

            builder.Services.AddSingleton<IFarsightRpcClient>(sp =>
                ActivatorUtilities.CreateInstance<FarsightRpcClient>(sp, sp.GetRequiredService<RegistrationOptions>().Options));

            return builder;
        }
    }
}
