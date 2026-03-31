using Farsight.RPC.Providers.Contracts;
using Farsight.RPC.Providers.Models;
using Farsight.RPC.Providers.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.AspNetCore.Mvc.Rendering;

namespace Farsight.RPC.Providers.Pages.Providers;

public sealed class IndexModel(ProviderAdminService providerAdminService) : PageModel
{
    [BindProperty(SupportsGet = true)]
    public ProviderListQuery Query { get; set; } = new();

    public IReadOnlyList<ProviderListItem> Rows { get; private set; } = [];

    public IEnumerable<SelectListItem> EnvironmentItems => Enum.GetValues<HostEnvironment>().Select(x => new SelectListItem(x.ToString(), x.ToString()));

    public IEnumerable<SelectListItem> TypeItems => Enum.GetValues<RpcEndpointType>().Select(x => new SelectListItem(x.ToString(), x.ToString()));

    public IEnumerable<SelectListItem> SortItems => Enum.GetValues<ProviderSort>().Select(x => new SelectListItem(x.ToString(), x.ToString()));

    public async Task OnGetAsync(CancellationToken cancellationToken)
        => Rows = await providerAdminService.GetListAsync(Query, cancellationToken);
}
