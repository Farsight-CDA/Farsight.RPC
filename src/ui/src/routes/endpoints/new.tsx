import { useNavigate, useSearchParams } from "@solidjs/router";
import { createSignal, onMount } from "solid-js";
import { EndpointForm } from "../../components/EndpointForm";
import { MessageBanner } from "../../components/MessageBanner";
import { createEndpoint, getApplications, getChains, getEndpointTypeLookups, getEnvironmentLookups, getProviders, getTracingModeLookups, probeEndpointAddress } from "../../lib/api";
import type { LookupItem, ProviderEditModel, ProviderRateLimitRow } from "../../lib/types";

const defaultModel = (type = "RealTime"): ProviderEditModel => ({
  type,
  environment: "Development",
  applicationId: "",
  chainId: "",
  providerId: "",
  address: "",
  indexerStepSize: null,
  dexIndexStepSize: null,
  indexBlockOffset: null,
  tracingMode: "Unknown",
});

export default function NewEndpointPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialType = Array.isArray(searchParams.type) ? searchParams.type[0] : searchParams.type;
  const [model, setModel] = createSignal<ProviderEditModel>(defaultModel(initialType || "RealTime"));
  const [applications, setApplications] = createSignal<LookupItem[]>([]);
  const [chains, setChains] = createSignal<LookupItem[]>([]);
  const [providers, setProviders] = createSignal<LookupItem[]>([]);
  const [environments, setEnvironments] = createSignal<string[]>([]);
  const [endpointTypes, setEndpointTypes] = createSignal<string[]>([]);
  const [tracingModes, setTracingModes] = createSignal<string[]>([]);
  const [message, setMessage] = createSignal<string | null>(null);
  const [error, setError] = createSignal<string | null>(null);

  onMount(async () => {
    const [apps, chainItems, providerItems, environmentItems, endpointTypeItems, tracingModeItems] = await Promise.all([
      getApplications(),
      getChains(),
      getProviders(),
      getEnvironmentLookups(),
      getEndpointTypeLookups(),
      getTracingModeLookups(),
    ]);
    setApplications(apps);
    setChains(chainItems);
    setProviders(providerItems.map((item: ProviderRateLimitRow) => ({ id: item.providerId, name: item.provider })));
    setEnvironments(environmentItems);
    setEndpointTypes(endpointTypeItems);
    setTracingModes(tracingModeItems);
  });

  const updateField = <K extends keyof ProviderEditModel>(key: K, value: ProviderEditModel[K]) => {
    setModel((current) => ({ ...current, [key]: value }));
  };

  const save = async (event: SubmitEvent) => {
    event.preventDefault();
    try {
      await createEndpoint(model());
      navigate("/endpoints", { replace: true });
    }
    catch(err) {
      setError(err instanceof Error ? err.message : "Failed to save endpoint.");
    }
  };

  const probe = async () => {
    try {
      const result = await probeEndpointAddress(model().type, model().address);
      setMessage(result.message);
      setError(null);
    }
    catch(err) {
      setError(err instanceof Error ? err.message : "Probe failed.");
    }
  };

  return (
    <div class="stack">
      <div class="page-header"><div><h1>New Endpoint</h1><p class="muted">Create a new RPC endpoint with the full schema editor.</p></div></div>
      <MessageBanner message={message()} tone="success" />
      <MessageBanner message={error()} tone="error" />
      <form class="panel stack" onSubmit={save}>
        <EndpointForm
          model={model()}
          applications={applications()}
          chains={chains()}
          providers={providers()}
          environments={environments()}
          endpointTypes={endpointTypes()}
          tracingModes={tracingModes()}
          onChange={updateField}
        />
        <div class="actions">
          <button class="button" type="submit">Save</button>
          <button class="button secondary" type="button" onClick={probe}>Probe</button>
        </div>
      </form>
    </div>
  );
}
