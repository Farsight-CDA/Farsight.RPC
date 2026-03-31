using Farsight.RPC.Providers.Contracts;
using Farsight.RPC.Providers.Models;
using Farsight.RPC.Providers.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.AspNetCore.Mvc.Rendering;

namespace Farsight.RPC.Providers.Pages.Providers;

public sealed class EditModel(ProviderAdminService providerAdminService, RpcProbeService rpcProbeService) : PageModel
{
    [BindProperty]
    public ProviderEditModel Input { get; set; } = new();

    public string? StatusMessage { get; private set; }

    public bool StatusIsError { get; private set; }

    public string? ProbeMessage { get; private set; }

    public bool ProbeSucceeded { get; private set; }

    public IEnumerable<SelectListItem> TypeItems => Enum.GetValues<RpcEndpointType>().Select(x => new SelectListItem(x.ToString(), x.ToString()));

    public IEnumerable<SelectListItem> EnvironmentItems => Enum.GetValues<HostEnvironment>().Select(x => new SelectListItem(x.ToString(), x.ToString()));

    public IEnumerable<SelectListItem> TracingModeItems => Enum.GetValues<TracingMode>().Select(x => new SelectListItem(x.ToString(), x.ToString()));

    public async Task<IActionResult> OnGetAsync(Guid? id, RpcEndpointType type = RpcEndpointType.RealTime, CancellationToken cancellationToken = default)
    {
        if (id.HasValue)
        {
            var model = await providerAdminService.GetEditModelAsync(type, id.Value, cancellationToken);
            if (model is null)
            {
                return NotFound();
            }

            Input = model;
        }
        else
        {
            Input.Type = type;
            Input.Environment = HostEnvironment.Development;
            Input.IsEnabled = true;
        }

        return Page();
    }

    public async Task<IActionResult> OnPostAsync(CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
        {
            StatusMessage = "Please correct the validation issues.";
            StatusIsError = true;
            return Page();
        }

        await providerAdminService.SaveAsync(Input, cancellationToken);
        StatusMessage = "Provider row saved.";
        return RedirectToPage("/Providers/Index");
    }

    public async Task<IActionResult> OnPostProbeAsync(CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
        {
            StatusMessage = "Please correct the validation issues before probing.";
            StatusIsError = true;
            return Page();
        }

        var result = await rpcProbeService.ProbeAsync(new ProbeRequest { Address = Input.Address, Type = Input.Type }, cancellationToken);
        ProbeMessage = result.Message;
        ProbeSucceeded = result.Succeeded;
        return Page();
    }

    public async Task<IActionResult> OnPostDeleteAsync(CancellationToken cancellationToken)
    {
        if (!Input.Id.HasValue)
        {
            return RedirectToPage("/Providers/Index");
        }

        await providerAdminService.DeleteAsync(Input.Type, Input.Id.Value, cancellationToken);
        return RedirectToPage("/Providers/Index");
    }
}
