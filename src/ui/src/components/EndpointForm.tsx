import { For, Show, type Component } from "solid-js";
import type { LookupItem, ProviderEditModel, RpcEndpointType } from "../lib/types";

interface Props {
  model: ProviderEditModel;
  applications: LookupItem[];
  chains: LookupItem[];
  providers: LookupItem[];
  environments: string[];
  endpointTypes: string[];
  tracingModes: string[];
  onChange: <K extends keyof ProviderEditModel>(key: K, value: ProviderEditModel[K]) => void;
}

function isArchive(type: RpcEndpointType) {
  return type === "Archive";
}

function isTracing(type: RpcEndpointType) {
  return type === "Tracing";
}

export const EndpointForm: Component<Props> = (props) => (
  <div class="form-grid">
    <div class="form-field">
      <label for="type">Type</label>
      <select id="type" class="select" value={props.model.type} onInput={(event) => props.onChange("type", event.currentTarget.value)}>
        <For each={props.endpointTypes}>{(item) => <option value={item}>{item}</option>}</For>
      </select>
    </div>

    <div class="form-field">
      <label for="environment">Environment</label>
      <select id="environment" class="select" value={props.model.environment} onInput={(event) => props.onChange("environment", event.currentTarget.value)}>
        <For each={props.environments}>{(item) => <option value={item}>{item}</option>}</For>
      </select>
    </div>

    <div class="form-field">
      <label for="provider">Provider</label>
      <select id="provider" class="select" value={props.model.providerId} onInput={(event) => props.onChange("providerId", event.currentTarget.value)}>
        <option value="">Select provider</option>
        <For each={props.providers}>{(item) => <option value={item.id}>{item.name}</option>}</For>
      </select>
    </div>

    <div class="form-field">
      <label for="application">Application</label>
      <select id="application" class="select" value={props.model.applicationId} onInput={(event) => props.onChange("applicationId", event.currentTarget.value)}>
        <option value="">Select application</option>
        <For each={props.applications}>{(item) => <option value={item.id}>{item.name}</option>}</For>
      </select>
    </div>

    <div class="form-field">
      <label for="chain">Chain</label>
      <select id="chain" class="select" value={props.model.chainId} onInput={(event) => props.onChange("chainId", event.currentTarget.value)}>
        <option value="">Select chain</option>
        <For each={props.chains}>{(item) => <option value={item.id}>{item.name}</option>}</For>
      </select>
    </div>

    <div class="form-field full">
      <label for="address">Address</label>
      <input id="address" class="input mono" value={props.model.address} onInput={(event) => props.onChange("address", event.currentTarget.value)} />
    </div>

    <Show when={isArchive(props.model.type)}>
      <>
        <div class="form-field">
          <label for="indexerStepSize">Indexer Step Size</label>
          <input id="indexerStepSize" class="input" type="number" value={props.model.indexerStepSize ?? ""} onInput={(event) => props.onChange("indexerStepSize", event.currentTarget.value ? Number(event.currentTarget.value) : null)} />
        </div>

        <div class="form-field">
          <label for="dexIndexStepSize">DEX Step Size</label>
          <input id="dexIndexStepSize" class="input" type="number" value={props.model.dexIndexStepSize ?? ""} onInput={(event) => props.onChange("dexIndexStepSize", event.currentTarget.value ? Number(event.currentTarget.value) : null)} />
        </div>

        <div class="form-field">
          <label for="indexBlockOffset">Block Offset</label>
          <input id="indexBlockOffset" class="input" type="number" value={props.model.indexBlockOffset ?? ""} onInput={(event) => props.onChange("indexBlockOffset", event.currentTarget.value ? Number(event.currentTarget.value) : null)} />
        </div>
      </>
    </Show>

    <Show when={isTracing(props.model.type)}>
      <div class="form-field">
        <label for="tracingMode">Tracing Mode</label>
        <select id="tracingMode" class="select" value={props.model.tracingMode} onInput={(event) => props.onChange("tracingMode", event.currentTarget.value)}>
          <For each={props.tracingModes}>{(item) => <option value={item}>{item}</option>}</For>
        </select>
      </div>
    </Show>
  </div>
);
