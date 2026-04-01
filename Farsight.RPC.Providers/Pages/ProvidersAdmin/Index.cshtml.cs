using Farsight.RPC.Providers.Models;
using Farsight.RPC.Providers.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace Farsight.RPC.Providers.Pages.ProvidersAdmin;

public sealed class IndexModel(ProviderAdminService providerAdminService) : PageModel
{
    [BindProperty] public string Name { get; set; } = string.Empty;
    [BindProperty] public int? RateLimit { get; set; }
    [TempData] public string? StatusMessage { get; set; }
    [TempData] public bool StatusIsError { get; set; }
    public IReadOnlyList<LookupItem> Items { get; private set; } = [];
    public IReadOnlyList<ProviderRateLimitRow> ProviderRows { get; private set; } = [];

    public async Task OnGetAsync(CancellationToken cancellationToken)
    {
        Items = await providerAdminService.GetProvidersAsync(cancellationToken);
        ProviderRows = await providerAdminService.GetProviderRateLimitsAsync(cancellationToken);
    }

    public async Task<IActionResult> OnPostAsync(CancellationToken cancellationToken)
    {
        if (RateLimit.HasValue && RateLimit.Value <= 0)
        {
            StatusMessage = "Rate limit must be greater than 0 when provided.";
            StatusIsError = true;
            await OnGetAsync(cancellationToken);
            return Page();
        }

        if (!await providerAdminService.SaveProviderAsync(Name, RateLimit, cancellationToken))
        {
            StatusMessage = string.IsNullOrWhiteSpace(Name) ? "Provider name is required." : "Provider already exists.";
            StatusIsError = true;
            await OnGetAsync(cancellationToken);
            return Page();
        }

        return RedirectToPage();
    }

    public async Task<IActionResult> OnPostSaveRateLimitAsync(Guid providerId, int? rateLimit, CancellationToken cancellationToken)
    {
        if (rateLimit.HasValue && rateLimit.Value <= 0)
        {
            StatusMessage = "Rate limit must be greater than 0 or left empty.";
            StatusIsError = true;
            return RedirectToPage();
        }

        await providerAdminService.SaveRateLimitAsync(providerId, rateLimit, cancellationToken);
        return RedirectToPage();
    }

    public async Task<IActionResult> OnPostDeleteAsync(Guid id, CancellationToken cancellationToken)
    {
        await providerAdminService.DeleteProviderAsync(id, cancellationToken);
        return RedirectToPage();
    }
}
