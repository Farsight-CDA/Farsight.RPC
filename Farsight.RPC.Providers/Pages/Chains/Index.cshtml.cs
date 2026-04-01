using Farsight.RPC.Providers.Models;
using Farsight.RPC.Providers.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace Farsight.RPC.Providers.Pages.Chains;

public sealed class IndexModel(ProviderAdminService providerAdminService) : PageModel
{
    [BindProperty] public string Name { get; set; } = string.Empty;
    public IReadOnlyList<LookupItem> Items { get; private set; } = [];
    public string? StatusMessage { get; private set; }
    public bool StatusIsError { get; private set; }

    public async Task OnGetAsync(CancellationToken cancellationToken) => Items = await providerAdminService.GetChainsAsync(cancellationToken);

    public async Task<IActionResult> OnPostAsync(CancellationToken cancellationToken)
    {
        if (await providerAdminService.SaveChainAsync(Name, cancellationToken))
        {
            return RedirectToPage();
        }

        StatusMessage = string.IsNullOrWhiteSpace(Name)
            ? "Chain name is required."
            : "Chain already exists.";
        StatusIsError = true;
        Items = await providerAdminService.GetChainsAsync(cancellationToken);
        return Page();
    }

    public async Task<IActionResult> OnPostDeleteAsync(Guid id, CancellationToken cancellationToken)
    {
        await providerAdminService.DeleteChainAsync(id, cancellationToken);
        return RedirectToPage();
    }
}
