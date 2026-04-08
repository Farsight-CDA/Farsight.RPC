using Farsight.Rpc.Types;
using Farsight.Rpc.Api.Models;
using Farsight.Rpc.Api.Services;
using FluentValidation;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.AspNetCore.Mvc.Rendering;

namespace Farsight.Rpc.Api.Pages.Providers;

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

    public IReadOnlyList<LookupItem> Applications { get; private set; } = [];

    public IReadOnlyList<LookupItem> Chains { get; private set; } = [];

    public IReadOnlyList<LookupItem> Providers { get; private set; } = [];

    public IEnumerable<SelectListItem> TypeItems => Enum.GetValues<RpcEndpointType>().Select(x => new SelectListItem(x.ToString(), x.ToString()));

    public IEnumerable<SelectListItem> EnvironmentItems => Enum.GetValues<HostEnvironment>().Select(x => new SelectListItem(x.ToString(), x.ToString()));

    public IEnumerable<SelectListItem> TracingModeItems => Enum.GetValues<TracingMode>().Select(x => new SelectListItem(x.ToString(), x.ToString()));

    public async Task<IActionResult> OnGetAsync(Guid? id, RpcEndpointType type = RpcEndpointType.RealTime, Guid? applicationId = null, Guid? chainId = null, HostEnvironment environment = HostEnvironment.Development, CancellationToken cancellationToken = default)
    {
        if(id.HasValue)
        {
            var model = await providerAdminService.GetEditModelAsync(type, id.Value, cancellationToken);
            if(model is null)
            {
                return NotFound();
            }

            Input = model;
        }
        else
        {
            Input.Type = type;
            Input.Environment = environment;
            Input.ApplicationId = applicationId ?? Guid.Empty;
            Input.ChainId = chainId ?? Guid.Empty;
        }

        await LoadSuggestionsAsync(cancellationToken);
        return Page();
    }

    public async Task<IActionResult> OnPostAsync(CancellationToken cancellationToken)
    {
        if(!await ValidateInputAsync(cancellationToken))
        {
            StatusMessage = "Please correct the validation issues.";
            StatusIsError = true;
            await LoadSuggestionsAsync(cancellationToken);
            return Page();
        }

        try
        {
            await providerAdminService.SaveAsync(Input, cancellationToken);
            StatusMessage = "RPC endpoint saved.";
            return RedirectToPage("/Providers/Index");
        }
        catch(RpcEndpointSchemaOutOfDateException ex)
        {
            ModelState.AddModelError(String.Empty, ex.Message);
            StatusMessage = ex.Message;
            StatusIsError = true;
            await LoadSuggestionsAsync(cancellationToken);
            return Page();
        }
    }

    public async Task<IActionResult> OnPostProbeAsync(CancellationToken cancellationToken)
    {
        if(!await ValidateInputAsync(cancellationToken))
        {
            StatusMessage = "Please correct the validation issues before probing.";
            StatusIsError = true;
            await LoadSuggestionsAsync(cancellationToken);
            return Page();
        }

        bool wasNew = !Input.Id.HasValue;
        try
        {
            await providerAdminService.SaveAsync(Input, cancellationToken);
        }
        catch(RpcEndpointSchemaOutOfDateException ex)
        {
            ModelState.AddModelError(String.Empty, ex.Message);
            StatusMessage = ex.Message;
            StatusIsError = true;
            await LoadSuggestionsAsync(cancellationToken);
            return Page();
        }

        if(wasNew)
        {
            var saved = await providerAdminService.GetListAsync(new ProviderSelectionModel
            {
                ApplicationId = Input.ApplicationId,
                ChainId = Input.ChainId,
                Environment = Input.Environment
            }, cancellationToken);

            Input.Id = saved
                .Where(x => x.Type == Input.Type && x.Address.ToString() == Input.Address)
                .OrderByDescending(x => x.UpdatedUtc)
                .Select(x => (Guid?) x.Id)
                .FirstOrDefault();
        }

        var probeRequest = new ProbeRequest { Address = Input.Address, Type = Input.Type };
        if(!await ValidateProbeAsync(probeRequest, cancellationToken))
        {
            StatusMessage = "Please correct the validation issues before probing.";
            StatusIsError = true;
            await LoadSuggestionsAsync(cancellationToken);
            return Page();
        }

        var result = await rpcProbeService.ProbeAsync(probeRequest, cancellationToken);
        if(Input.Id.HasValue)
        {
            await providerAdminService.UpdateProbeResultAsync(Input.Type, Input.Id.Value, result.Succeeded, cancellationToken);
        }
        ProbeMessage = result.Message;
        ProbeSucceeded = result.Succeeded;
        await LoadSuggestionsAsync(cancellationToken);
        return Page();
    }

    public async Task<IActionResult> OnPostDeleteAsync(CancellationToken cancellationToken)
    {
        if(!Input.Id.HasValue)
        {
            return RedirectToPage("/Providers/Index");
        }

        await providerAdminService.DeleteAsync(Input.Type, Input.Id.Value, cancellationToken);
        return RedirectToPage("/Providers/Index");
    }

    private async Task LoadSuggestionsAsync(CancellationToken cancellationToken)
    {
        Applications = await providerAdminService.GetApplicationsAsync(cancellationToken);
        Chains = await providerAdminService.GetChainsAsync(cancellationToken);
        Providers = await providerAdminService.GetProvidersAsync(cancellationToken);
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
        foreach(var error in validationResult.Errors)
        {
            string key = error.PropertyName switch
            {
                nameof(ProbeRequest.Address) => $"{nameof(Input)}.{nameof(Input.Address)}",
                nameof(ProbeRequest.Type) => $"{nameof(Input)}.{nameof(Input.Type)}",
                _ => String.Empty
            };
            ModelState.AddModelError(key, error.ErrorMessage);
        }

        return validationResult.IsValid;
    }

    private void AddValidationErrors(IEnumerable<FluentValidation.Results.ValidationFailure> errors)
    {
        foreach(var error in errors)
        {
            string key = String.IsNullOrWhiteSpace(error.PropertyName)
                ? String.Empty
                : $"{nameof(Input)}.{error.PropertyName}";
            ModelState.AddModelError(key, error.ErrorMessage);
        }
    }
}
