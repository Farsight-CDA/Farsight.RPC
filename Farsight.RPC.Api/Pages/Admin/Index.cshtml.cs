using Farsight.RPC.Types;
using Farsight.RPC.Api.Models;
using Farsight.RPC.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.AspNetCore.Mvc.Rendering;

namespace Farsight.RPC.Api.Pages.Admin;

[Authorize(Policy = AuthorizationPolicies.ADMIN_ONLY)]
public sealed class IndexModel(ProviderAdminService providerAdminService) : PageModel
{
    [BindProperty]
    public Guid ApplicationId { get; set; }

    [BindProperty]
    public HostEnvironment Environment { get; set; } = HostEnvironment.Development;

    [TempData]
    public string? GeneratedApiKey { get; set; }

    [TempData]
    public string? StatusMessage { get; set; }

    [TempData]
    public bool StatusIsError { get; set; }

    public IReadOnlyList<LookupItem> Applications { get; private set; } = [];
    public IReadOnlyList<ApiClientListItem> Items { get; private set; } = [];

    public IEnumerable<SelectListItem> EnvironmentItems => Enum.GetValues<HostEnvironment>()
        .Select(x => new SelectListItem(x.ToString(), x.ToString(), x == Environment));

    public async Task OnGetAsync(CancellationToken cancellationToken)
    {
        await LoadAsync(cancellationToken);
    }

    public async Task<IActionResult> OnPostAsync(CancellationToken cancellationToken)
    {
        var result = await providerAdminService.CreateApiClientAsync(ApplicationId, Environment, cancellationToken);
        if(result is null)
        {
            StatusMessage = ApplicationId == Guid.Empty ? "Application is required." : "Could not generate API key.";
            StatusIsError = true;
            await LoadAsync(cancellationToken);
            return Page();
        }

        GeneratedApiKey = result.ApiKey;
        StatusMessage = "API key created. Copy it now; it will not be shown again.";
        StatusIsError = false;
        return RedirectToPage();
    }

    public async Task<IActionResult> OnPostToggleAsync(Guid id, CancellationToken cancellationToken)
    {
        await providerAdminService.ToggleApiClientAsync(id, cancellationToken);
        return RedirectToPage();
    }

    private async Task LoadAsync(CancellationToken cancellationToken)
    {
        Applications = await providerAdminService.GetApplicationsAsync(cancellationToken);
        Items = await providerAdminService.GetApiClientsAsync(cancellationToken);
    }
}
