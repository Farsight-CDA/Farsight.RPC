using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace Farsight.RPC.Api.Pages;

[AllowAnonymous]
public sealed class ErrorModel : PageModel
{
    public void OnGet()
    {
    }
}
