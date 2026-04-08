using Farsight.RPC.Api.Models;
using Farsight.RPC.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace Farsight.RPC.Api.Pages.Applications;

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
