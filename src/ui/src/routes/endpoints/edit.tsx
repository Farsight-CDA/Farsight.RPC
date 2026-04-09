import { useNavigate, useSearchParams } from "@solidjs/router";
import { Show, createSignal, onMount } from "solid-js";
import { EndpointForm } from "../../components/EndpointForm";
import { MessageBanner } from "../../components/MessageBanner";
import { deleteEndpoint, getApplications, getChains, getEndpoint, getEndpointTypeLookups, getEnvironmentLookups, getProviders, getTracingModeLookups, probeEndpointAddress, updateEndpoint } from "../../lib/api";
import type { LookupItem, ProviderEditModel, ProviderRateLimitRow } from "../../lib/types";

export default function EditEndpointPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [model, setModel] = createSignal<ProviderEditModel | null>(null);
  const [applications, setApplications] = createSignal<LookupItem[]>([]);
  const [chains, setChains] = createSignal<LookupItem[]>([]);
  const [providers, setProviders] = createSignal<LookupItem[]>([]);
  const [environments, setEnvironments] = createSignal<string[]>([]);
  const [endpointTypes, setEndpointTypes] = createSignal<string[]>([]);
  const [tracingModes, setTracingModes] = createSignal<string[]>([]);
  const [message, setMessage] = createSignal<string | null>(null);
  const [error, setError] = createSignal<string | null>(null);

  onMount(async () => {
    try {
      const endpointId = Array.isArray(searchParams.id) ? searchParams.id[0] : searchParams.id;
      const endpointType = Array.isArray(searchParams.type) ? searchParams.type[0] : searchParams.type;
      if(!endpointId || !endpointType) {
        throw new Error("Endpoint id and type are required.");
      }

      const [apps, chainItems, providerItems, environmentItems, endpointTypeItems, tracingModeItems, endpoint] = await Promise.all([
        getApplications(),
        getChains(),
        getProviders(),
        getEnvironmentLookups(),
        getEndpointTypeLookups(),
        getTracingModeLookups(),
        getEndpoint(endpointType, endpointId),
      ]);

      setApplications(apps);
      setChains(chainItems);
      setProviders(providerItems.map((item: ProviderRateLimitRow) => ({ id: item.providerId, name: item.provider })));
      setEnvironments(environmentItems);
      setEndpointTypes(endpointTypeItems);
      setTracingModes(tracingModeItems);
      setModel(endpoint);
    }
    catch(err) {
      setError(err instanceof Error ? err.message : "Failed to load endpoint.");
    }
  });

  const updateField = <K extends keyof ProviderEditModel>(key: K, value: ProviderEditModel[K]) => {
    setModel((current) => current ? { ...current, [key]: value } : current);
  };

  const save = async (event: SubmitEvent) => {
    event.preventDefault();
    if(!model()) {
      return;
    }

    try {
      await updateEndpoint(model()!);
      setMessage("Endpoint saved.");
      setError(null);
    }
    catch(err) {
      setError(err instanceof Error ? err.message : "Failed to save endpoint.");
    }
  };

  const probe = async () => {
    if(!model()) {
      return;
    }

    try {
      const result = await probeEndpointAddress(model()!.type, model()!.address);
      setMessage(result.message);
      setError(null);
    }
    catch(err) {
      setError(err instanceof Error ? err.message : "Probe failed.");
    }
  };

  const remove = async () => {
    if(!model() || !model()!.id) {
      return;
    }

    if(!window.confirm("Permanently delete this RPC endpoint?")) {
      return;
    }

    try {
      await deleteEndpoint(model()!.type, model()!.id!);
      navigate("/endpoints", { replace: true });
    }
    catch(err) {
      setError(err instanceof Error ? err.message : "Failed to delete endpoint.");
    }
  };

  return (
    <div class="stack">
      <div class="page-header"><div><h1>Edit Endpoint</h1><p class="muted">Update the endpoint shape, provider assignment, and probe target.</p></div></div>
      <MessageBanner message={message()} tone="success" />
      <MessageBanner message={error()} tone="error" />
      <Show when={model()} fallback={<div class="panel">Loading endpoint...</div>}>
        {(current) => (
          <form class="panel stack" onSubmit={save}>
            <EndpointForm
              model={current()}
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
              <button class="button danger" type="button" onClick={remove}>Delete</button>
            </div>
          </form>
        )}
      </Show>
    </div>
  );
}
