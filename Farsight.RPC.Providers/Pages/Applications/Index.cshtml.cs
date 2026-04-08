using Farsight.RPC.Providers.Models;
using Farsight.RPC.Providers.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace Farsight.RPC.Providers.Pages.Applications;

public sealed class IndexModel(ProviderAdminService providerAdminService) : PageModel
{
    [BindProperty] public string Name { get; set; } = String.Empty;
    public IReadOnlyList<LookupItem> Items { get; private set; } = [];

    public async Task OnGetAsync(CancellationToken cancellationToken) => Items = await providerAdminService.GetApplicationsAsync(cancellationToken);

    public async Task<IActionResult> OnPostAsync(CancellationToken cancellationToken)
    {
        await providerAdminService.SaveApplicationAsync(Name, cancellationToken);
        return RedirectToPage();
    }

    public async Task<IActionResult> OnPostDeleteAsync(Guid id, CancellationToken cancellationToken)
    {
        await providerAdminService.DeleteApplicationAsync(id, cancellationToken);
        return RedirectToPage();
    }
}
