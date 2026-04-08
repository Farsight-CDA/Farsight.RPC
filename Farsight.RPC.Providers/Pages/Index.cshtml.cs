using Farsight.RPC.Providers.Contracts;
using Farsight.RPC.Providers.Models;
using Farsight.RPC.Providers.Services;
using FluentValidation;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace Farsight.RPC.Providers.Pages;

public sealed class IndexModel(
    ProviderAdminService providerAdminService,
    RpcProbeService rpcProbeService,
    IValidator<ProviderEditModel> providerEditModelValidator) : PageModel
{
    // Selection state
    [BindProperty(SupportsGet = true)]
    public Guid? SelectedApplicationId { get; set; }

    [BindProperty(SupportsGet = true)]
    public Guid? SelectedChainId { get; set; }

    [BindProperty(SupportsGet = true)]
    public HostEnvironment? SelectedEnvironment { get; set; }

    // Data sources
    public IReadOnlyList<LookupItem> Applications { get; private set; } = [];
    public IReadOnlyList<LookupItem> Chains { get; private set; } = [];
    public IReadOnlyList<LookupItem> ProvidersList { get; private set; } = [];
    public IReadOnlyList<ProviderListItem> Providers { get; private set; } = [];

    // Inline add form properties
    [BindProperty]
    public RpcEndpointType NewProviderType { get; set; } = RpcEndpointType.RealTime;

    [BindProperty]
    public Guid NewProviderId { get; set; }

    [BindProperty]
    public string NewAddress { get; set; } = String.Empty;

    // Show inline form flag
    [BindProperty(SupportsGet = true)]
    public bool ShowAddForm { get; set; }

    // Probe result messages (TempData)
    public string? ProbeMessage { get; set; }
    public bool ProbeSucceeded { get; set; }

    public string? StatusMessage { get; private set; }

    public bool StatusIsError { get; private set; }

    // Computed properties for flow state
    public bool HasSelectedApplication => SelectedApplicationId.HasValue;
    public bool HasSelectedChain => SelectedChainId.HasValue;
    public bool HasSelectedEnvironment => SelectedEnvironment.HasValue;
    public bool CanShowResults => HasSelectedApplication && HasSelectedChain && HasSelectedEnvironment;
    public async Task OnGetAsync(CancellationToken cancellationToken)
    {
        Applications = await providerAdminService.GetApplicationsAsync(cancellationToken);
        Chains = await providerAdminService.GetChainsAsync(cancellationToken);
        ProvidersList = await providerAdminService.GetProvidersAsync(cancellationToken);

        // Load probe result from TempData
        if(TempData["ProbeMessage"] is string probeMessage)
        {
            ProbeMessage = probeMessage;
            ProbeSucceeded = TempData["ProbeSucceeded"] is bool probeSucceeded && probeSucceeded;
        }

        if(CanShowResults)
        {
            var query = new ProviderSelectionModel
            {
                ApplicationId = SelectedApplicationId!.Value,
                Environment = SelectedEnvironment!.Value,
                ChainId = SelectedChainId!.Value
            };
            Providers = await providerAdminService.GetListAsync(query, cancellationToken);
        }
    }

    public IActionResult OnPost()
    {
        // Determine what changed and reset downstream selections
        bool changedApp = SelectedApplicationId != GetPreviousApplicationId();
        bool changedChain = SelectedChainId != GetPreviousChainId();

        if(changedApp)
        {
            // App changed - reset everything downstream
            SelectedChainId = null;
            SelectedEnvironment = null;
        }
        else if(changedChain)
        {
            // Chain changed - reset environment
            SelectedEnvironment = null;
        }

        // Redirect with current state (some values may be null)
        return RedirectToPage(new
        {
            SelectedApplicationId,
            SelectedChainId,
            SelectedEnvironment,
            ShowAddForm
        });
    }

    public async Task<IActionResult> OnPostAddProviderAsync(CancellationToken cancellationToken)
    {
        if(!CanShowResults)
        {
            return RedirectToPage();
        }

        var model = new ProviderEditModel
        {
            Type = NewProviderType,
            Environment = SelectedEnvironment!.Value,
            ApplicationId = SelectedApplicationId!.Value,
            ChainId = SelectedChainId!.Value,
            ProviderId = NewProviderId,
            Address = NewAddress
        };

        var validationResult = await providerEditModelValidator.ValidateAsync(model, cancellationToken);
        if(!validationResult.IsValid)
        {
            foreach(var error in validationResult.Errors)
            {
                string key = error.PropertyName switch
                {
                    nameof(ProviderEditModel.ProviderId) => nameof(NewProviderId),
                    nameof(ProviderEditModel.Address) => nameof(NewAddress),
                    nameof(ProviderEditModel.Type) => nameof(NewProviderType),
                    _ => String.Empty
                };
                ModelState.AddModelError(key, error.ErrorMessage);
            }

            StatusMessage = "Please correct the validation issues.";
            StatusIsError = true;
            ShowAddForm = true;
            await LoadPageDataAsync(cancellationToken);
            return Page();
        }

        try
        {
            await providerAdminService.SaveAsync(model, cancellationToken);
        }
        catch(RpcEndpointSchemaOutOfDateException ex)
        {
            ModelState.AddModelError(String.Empty, ex.Message);
            StatusMessage = ex.Message;
            StatusIsError = true;
            ShowAddForm = true;
            await LoadPageDataAsync(cancellationToken);
            return Page();
        }

        // Redirect back to results with form hidden
        return RedirectToPage(new
        {
            SelectedApplicationId,
            SelectedChainId,
            SelectedEnvironment,
            ShowAddForm = false
        });
    }

    public string ShortenAddress(Uri address, int maxLength = 40)
    {
        string url = address.ToString();
        return url.Length <= maxLength
            ? url
            : String.Concat(url.AsSpan(0, maxLength - 3), "...");
    }

    // Helper methods to track what changed (compare with form values before bind)
    private Guid? GetPreviousApplicationId()
    {
        if(Request.Form.TryGetValue("PreviousApplicationId", out var value) &&
            Guid.TryParse(value, out var id))
        {
            return id;
        }
        return null;
    }

    private Guid? GetPreviousChainId()
    {
        if(Request.Form.TryGetValue("PreviousChainId", out var value) &&
            Guid.TryParse(value, out var id))
        {
            return id;
        }
        return null;
    }

    public async Task<IActionResult> OnPostProbeAsync(Guid id, RpcEndpointType type, CancellationToken cancellationToken)
    {
        if(!CanShowResults)
        {
            return RedirectToPage();
        }

        // Get the provider details to probe
        var provider = await providerAdminService.GetEditModelAsync(type, id, cancellationToken);
        if(provider is null)
        {
            return RedirectToPage(new { SelectedApplicationId, SelectedChainId, SelectedEnvironment });
        }

        var probeRequest = new ProbeRequest { Address = provider.Address, Type = type };
        var result = await rpcProbeService.ProbeAsync(probeRequest, cancellationToken);
        await providerAdminService.UpdateProbeResultAsync(type, id, result.Succeeded, cancellationToken);

        // Store result in TempData to show after redirect
        TempData["ProbeMessage"] = result.Message;
        TempData["ProbeSucceeded"] = result.Succeeded;

        return RedirectToPage(new { SelectedApplicationId, SelectedChainId, SelectedEnvironment });
    }

    public async Task<IActionResult> OnPostDeleteAsync(Guid id, RpcEndpointType type, CancellationToken cancellationToken)
    {
        if(!CanShowResults)
        {
            return RedirectToPage();
        }

        await providerAdminService.DeleteAsync(type, id, cancellationToken);

        return RedirectToPage(new { SelectedApplicationId, SelectedChainId, SelectedEnvironment });
    }

    private async Task LoadPageDataAsync(CancellationToken cancellationToken)
    {
        Applications = await providerAdminService.GetApplicationsAsync(cancellationToken);
        Chains = await providerAdminService.GetChainsAsync(cancellationToken);
        ProvidersList = await providerAdminService.GetProvidersAsync(cancellationToken);

        if(!CanShowResults)
        {
            Providers = [];
            return;
        }

        Providers = await providerAdminService.GetListAsync(new ProviderSelectionModel
        {
            ApplicationId = SelectedApplicationId!.Value,
            Environment = SelectedEnvironment!.Value,
            ChainId = SelectedChainId!.Value
        }, cancellationToken);
    }
}
