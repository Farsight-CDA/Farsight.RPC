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
  <div class="grid gap-4 lg:grid-cols-3">
    <div class="grid gap-2">
      <label class="text-sm text-slate-300" for="type">Type</label>
      <select id="type" class="w-full rounded border border-white/10 bg-slate-950 px-3 py-2 text-sm" value={props.model.type} onInput={(event) => props.onChange("type", event.currentTarget.value)}>
        <For each={props.endpointTypes}>{(item) => <option value={item}>{item}</option>}</For>
      </select>
    </div>

    <div class="grid gap-2">
      <label class="text-sm text-slate-300" for="environment">Environment</label>
      <select id="environment" class="w-full rounded border border-white/10 bg-slate-950 px-3 py-2 text-sm" value={props.model.environment} onInput={(event) => props.onChange("environment", event.currentTarget.value)}>
        <For each={props.environments}>{(item) => <option value={item}>{item}</option>}</For>
      </select>
    </div>

    <div class="grid gap-2">
      <label class="text-sm text-slate-300" for="provider">Provider</label>
      <select id="provider" class="w-full rounded border border-white/10 bg-slate-950 px-3 py-2 text-sm" value={props.model.providerId} onInput={(event) => props.onChange("providerId", event.currentTarget.value)}>
        <option value="">Select provider</option>
        <For each={props.providers}>{(item) => <option value={item.id}>{item.name}</option>}</For>
      </select>
    </div>

    <div class="grid gap-2">
      <label class="text-sm text-slate-300" for="application">Application</label>
      <select id="application" class="w-full rounded border border-white/10 bg-slate-950 px-3 py-2 text-sm" value={props.model.applicationId} onInput={(event) => props.onChange("applicationId", event.currentTarget.value)}>
        <option value="">Select application</option>
        <For each={props.applications}>{(item) => <option value={item.id}>{item.name}</option>}</For>
      </select>
    </div>

    <div class="grid gap-2">
      <label class="text-sm text-slate-300" for="chain">Chain</label>
      <select id="chain" class="w-full rounded border border-white/10 bg-slate-950 px-3 py-2 text-sm" value={props.model.chainId} onInput={(event) => props.onChange("chainId", event.currentTarget.value)}>
        <option value="">Select chain</option>
        <For each={props.chains}>{(item) => <option value={item.id}>{item.name}</option>}</For>
      </select>
    </div>

    <div class="grid gap-2 lg:col-span-3">
      <label class="text-sm text-slate-300" for="address">Address</label>
      <input id="address" class="w-full rounded border border-white/10 bg-slate-950 px-3 py-2 text-sm" value={props.model.address} onInput={(event) => props.onChange("address", event.currentTarget.value)} />
    </div>

    <Show when={isArchive(props.model.type)}>
      <>
        <div class="grid gap-2">
          <label class="text-sm text-slate-300" for="indexerStepSize">Indexer Step Size</label>
          <input id="indexerStepSize" class="w-full rounded border border-white/10 bg-slate-950 px-3 py-2 text-sm" type="number" value={props.model.indexerStepSize ?? ""} onInput={(event) => props.onChange("indexerStepSize", event.currentTarget.value ? Number(event.currentTarget.value) : null)} />
        </div>

        <div class="grid gap-2">
          <label class="text-sm text-slate-300" for="dexIndexStepSize">DEX Step Size</label>
          <input id="dexIndexStepSize" class="w-full rounded border border-white/10 bg-slate-950 px-3 py-2 text-sm" type="number" value={props.model.dexIndexStepSize ?? ""} onInput={(event) => props.onChange("dexIndexStepSize", event.currentTarget.value ? Number(event.currentTarget.value) : null)} />
        </div>

        <div class="grid gap-2">
          <label class="text-sm text-slate-300" for="indexBlockOffset">Block Offset</label>
          <input id="indexBlockOffset" class="w-full rounded border border-white/10 bg-slate-950 px-3 py-2 text-sm" type="number" value={props.model.indexBlockOffset ?? ""} onInput={(event) => props.onChange("indexBlockOffset", event.currentTarget.value ? Number(event.currentTarget.value) : null)} />
        </div>
      </>
    </Show>

    <Show when={isTracing(props.model.type)}>
      <div class="grid gap-2">
        <label class="text-sm text-slate-300" for="tracingMode">Tracing Mode</label>
        <select id="tracingMode" class="w-full rounded border border-white/10 bg-slate-950 px-3 py-2 text-sm" value={props.model.tracingMode} onInput={(event) => props.onChange("tracingMode", event.currentTarget.value)}>
          <For each={props.tracingModes}>{(item) => <option value={item}>{item}</option>}</For>
        </select>
      </div>
    </Show>
  </div>
);
