using Farsight.RPC.Providers.Contracts;
using Farsight.RPC.Providers.Models;
using Farsight.RPC.Providers.Services;
using FluentValidation;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.AspNetCore.Mvc.Rendering;

namespace Farsight.RPC.Providers.Pages.Providers;

public sealed class EditModel(
    ProviderAdminService providerAdminService,
    RpcProbeService rpcProbeService,
    IValidator<ProviderEditModel> providerEditModelValidator,
    IValidator<ProbeRequest> probeRequestValidator) : PageModel
{
    [BindProperty]
    public ProviderEditModel Input { get; set; } = new();

    public string? StatusMessage { get; private set; }

    public bool StatusIsError { get; private set; }

    public string? ProbeMessage { get; private set; }

    public bool ProbeSucceeded { get; private set; }

    public IReadOnlyList<string> KnownApplications { get; private set; } = [];

    public IReadOnlyList<string> KnownChains { get; private set; } = [];

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

        await LoadSuggestionsAsync(cancellationToken);
        return Page();
    }

    public async Task<IActionResult> OnPostAsync(CancellationToken cancellationToken)
    {
        if (!await ValidateInputAsync(cancellationToken))
        {
            StatusMessage = "Please correct the validation issues.";
            StatusIsError = true;
            await LoadSuggestionsAsync(cancellationToken);
            return Page();
        }

        await providerAdminService.SaveAsync(Input, cancellationToken);
        StatusMessage = "Provider row saved.";
        return RedirectToPage("/Providers/Index");
    }

    public async Task<IActionResult> OnPostProbeAsync(CancellationToken cancellationToken)
    {
        var probeRequest = new ProbeRequest { Address = Input.Address, Type = Input.Type };
        if (!await ValidateProbeAsync(probeRequest, cancellationToken))
        {
            StatusMessage = "Please correct the validation issues before probing.";
            StatusIsError = true;
            await LoadSuggestionsAsync(cancellationToken);
            return Page();
        }

        var result = await rpcProbeService.ProbeAsync(probeRequest, cancellationToken);
        ProbeMessage = result.Message;
        ProbeSucceeded = result.Succeeded;
        await LoadSuggestionsAsync(cancellationToken);
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

    private async Task LoadSuggestionsAsync(CancellationToken cancellationToken)
    {
        KnownApplications = await providerAdminService.GetKnownApplicationsAsync(cancellationToken);
        KnownChains = await providerAdminService.GetKnownChainsAsync(cancellationToken);
    }

    private async Task<bool> ValidateInputAsync(CancellationToken cancellationToken)
    {
        ModelState.Clear();
        var validationResult = await providerEditModelValidator.ValidateAsync(Input, cancellationToken);
        AddValidationErrors(validationResult.Errors);
        return validationResult.IsValid;
    }

    private async Task<bool> ValidateProbeAsync(ProbeRequest probeRequest, CancellationToken cancellationToken)
    {
        ModelState.Clear();
        var validationResult = await probeRequestValidator.ValidateAsync(probeRequest, cancellationToken);
        foreach (var error in validationResult.Errors)
        {
            var key = error.PropertyName switch
            {
                nameof(ProbeRequest.Address) => $"{nameof(Input)}.{nameof(Input.Address)}",
                nameof(ProbeRequest.Type) => $"{nameof(Input)}.{nameof(Input.Type)}",
                _ => string.Empty
            };
            ModelState.AddModelError(key, error.ErrorMessage);
        }

        return validationResult.IsValid;
    }

    private void AddValidationErrors(IEnumerable<FluentValidation.Results.ValidationFailure> errors)
    {
        foreach (var error in errors)
        {
            var key = string.IsNullOrWhiteSpace(error.PropertyName)
                ? string.Empty
                : $"{nameof(Input)}.{error.PropertyName}";
            ModelState.AddModelError(key, error.ErrorMessage);
        }
    }
}
