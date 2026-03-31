using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace Farsight.RPC.Providers.Pages;

[AllowAnonymous]
public sealed class ErrorModel : PageModel
{
    public void OnGet()
    {
    }
}
