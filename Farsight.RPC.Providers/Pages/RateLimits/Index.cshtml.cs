using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace Farsight.RPC.Providers.Pages.RateLimits;

public sealed class IndexModel : PageModel
{
    [BindProperty] public Guid ProviderId { get; set; }
    [BindProperty] public int? RateLimit { get; set; }
    public IActionResult OnGetAsync(CancellationToken cancellationToken) => RedirectToPage("/ProvidersAdmin/Index");

    public IActionResult OnPostAsync(CancellationToken cancellationToken) => RedirectToPage("/ProvidersAdmin/Index");
}
