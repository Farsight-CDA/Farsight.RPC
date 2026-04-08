using Farsight.RPC.Types;
using Farsight.RPC.Api.Models;
using Farsight.RPC.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.AspNetCore.Mvc.Rendering;

namespace Farsight.RPC.Api.Pages.Providers;

public sealed class IndexModel(ProviderAdminService providerAdminService) : PageModel
{
    [BindProperty(SupportsGet = true)]
    public ProviderSelectionModel Query { get; set; } = new();

    public IReadOnlyList<ProviderListItem> Rows { get; private set; } = [];

    public IEnumerable<SelectListItem> EnvironmentItems => Enum.GetValues<HostEnvironment>().Select(x => new SelectListItem(x.ToString(), x.ToString()));

    public IReadOnlyList<LookupItem> Applications { get; private set; } = [];

    public IReadOnlyList<LookupItem> Chains { get; private set; } = [];

    public async Task OnGetAsync(CancellationToken cancellationToken)
    {
        Applications = await providerAdminService.GetApplicationsAsync(cancellationToken);
        Chains = await providerAdminService.GetChainsAsync(cancellationToken);
        Rows = await providerAdminService.GetListAsync(Query, cancellationToken);
    }
}
