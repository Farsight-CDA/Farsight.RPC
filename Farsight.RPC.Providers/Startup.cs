using Farsight.Common.Startup;

namespace Farsight.RPC.Providers;

public partial class Startup : FarsightStartup
{
    public override Task StartingAsync(CancellationToken cancellationToken)
        => SetupServicesAsync(cancellationToken);

    public override Task StartAsync(CancellationToken cancellationToken)
        => InitializeServicesAsync(cancellationToken);

    public override Task StartedAsync(CancellationToken cancellationToken)
        => RunServicesAsync(_lifetime.ApplicationStopping);
}
