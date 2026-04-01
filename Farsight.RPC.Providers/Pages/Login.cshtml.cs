using Farsight.RPC.Providers.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using System.ComponentModel.DataAnnotations;

namespace Farsight.RPC.Providers.Pages;

[AllowAnonymous]
public sealed class LoginModel(AdminAuthenticationService authenticationService) : PageModel
{
    [BindProperty]
    public InputModel Input { get; set; } = new();

    public string? ErrorMessage { get; private set; }

    public void OnGet()
    {
    }

    public async Task<IActionResult> OnPostAsync(CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
        {
            return Page();
        }

        if (await authenticationService.SignInAsync(HttpContext, Input.UserName, Input.Password, cancellationToken))
        {
            return RedirectToPage("/Providers/Index");
        }

        ErrorMessage = "Invalid username or password.";
        return Page();
    }

    public sealed class InputModel
    {
        [Required]
        public string UserName { get; set; } = string.Empty;

        [Required]
        public string Password { get; set; } = string.Empty;
    }
}
