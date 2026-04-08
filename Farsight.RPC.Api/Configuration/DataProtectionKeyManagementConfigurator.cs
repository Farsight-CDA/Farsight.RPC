using Microsoft.AspNetCore.DataProtection.KeyManagement;
using Microsoft.AspNetCore.DataProtection.Repositories;
using Microsoft.Extensions.Options;

namespace Farsight.Rpc.Api.Configuration;

internal sealed class DataProtectionKeyManagementConfigurator(
    DataProtectionStorageOptions dataProtectionStorageOptions,
    ILoggerFactory loggerFactory) : IConfigureOptions<KeyManagementOptions>
{
    public void Configure(KeyManagementOptions options)
    {
        Directory.CreateDirectory(dataProtectionStorageOptions.KeysDirectory);
        options.XmlRepository = new FileSystemXmlRepository(new DirectoryInfo(dataProtectionStorageOptions.KeysDirectory), loggerFactory);
    }
}
