import { createQuery, useQueryClient } from "@tanstack/solid-query";
import { A } from "@solidjs/router";
import { For, Show, createMemo, createSignal } from "solid-js";
import { MessageBanner } from "../components/MessageBanner";
import { createRpc, deleteRpc, getApplications, getChains, getRpcs, getEndpointTypeLookups, getEnvironmentLookups, getProviders } from "../lib/api";
import { queryKeys } from "../lib/query";
import type { HostEnvironment, ProviderListItem, RpcEndpointType } from "../lib/types";

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const [message, setMessage] = createSignal<string | null>(null);
  const [error, setError] = createSignal<string | null>(null);
  const [applicationId, setApplicationId] = createSignal("");
  const [chain, setChain] = createSignal("");
  const [environment, setEnvironment] = createSignal<HostEnvironment>("Development");
  const [type, setType] = createSignal<RpcEndpointType>("RealTime");
  const [providerId, setProviderId] = createSignal("");
  const [address, setAddress] = createSignal("");

  const canQuery = createMemo(() => Boolean(applicationId() && chain()));
  const applicationsQuery = createQuery(() => ({
    queryKey: queryKeys.applications,
    queryFn: getApplications,
  }));
  const chainsQuery = createQuery(() => ({
    queryKey: queryKeys.chains,
    queryFn: getChains,
  }));
  const providersQuery = createQuery(() => ({
    queryKey: queryKeys.providers,
    queryFn: getProviders,
  }));
  const environmentsQuery = createQuery(() => ({
    queryKey: queryKeys.environments,
    queryFn: getEnvironmentLookups,
  }));
  const endpointTypesQuery = createQuery(() => ({
    queryKey: queryKeys.endpointTypes,
    queryFn: getEndpointTypeLookups,
  }));
  const rowsQuery = createQuery(() => ({
    queryKey: queryKeys.rpcs(applicationId() || undefined, chain() || undefined, environment()),
    queryFn: () => getRpcs({ applicationId: applicationId(), chain: chain(), environment: environment() }),
    enabled: canQuery(),
  }));
  const rows = () => rowsQuery.data ?? [];
  const currentError = () => error()
    ?? (applicationsQuery.error instanceof Error ? applicationsQuery.error.message : null)
    ?? (chainsQuery.error instanceof Error ? chainsQuery.error.message : null)
    ?? (providersQuery.error instanceof Error ? providersQuery.error.message : null)
    ?? (environmentsQuery.error instanceof Error ? environmentsQuery.error.message : null)
    ?? (endpointTypesQuery.error instanceof Error ? endpointTypesQuery.error.message : null)
    ?? (rowsQuery.error instanceof Error ? rowsQuery.error.message : null);

  const addEndpoint = async (event: SubmitEvent) => {
    event.preventDefault();
    setMessage(null);
    setError(null);

    try {
      await createRpc({
        type: type(),
        environment: environment(),
        applicationId: applicationId(),
        chain: chain(),
        providerId: providerId(),
        address: address(),
        indexerStepSize: null,
        dexIndexStepSize: null,
        indexBlockOffset: null,
        tracingMode: "Unknown",
      });
      setAddress("");
      setMessage("RPC endpoint added.");
      await queryClient.invalidateQueries({ queryKey: queryKeys.rpcs(applicationId(), chain(), environment()) });
    }
    catch(err) {
      setError(err instanceof Error ? err.message : "Failed to add endpoint.");
    }
  };

  const removeEndpoint = async (row: ProviderListItem) => {
    if(!window.confirm(`Delete ${row.provider} ${row.type} endpoint?`)) {
      return;
    }

    try {
      await deleteRpc(row.type, row.id);
      setMessage("RPC endpoint removed.");
      setError(null);
      await queryClient.invalidateQueries({ queryKey: queryKeys.rpcs(applicationId(), chain(), environment()) });
    }
    catch(err) {
      setError(err instanceof Error ? err.message : "Delete failed.");
    }
  };

  return (
    <div class="space-y-6">
      <div>
        <h1 class="text-2xl text-white">Dashboard</h1>
        <p class="text-sm text-slate-400">Select an application, chain, and environment to manage live endpoint assignments.</p>
      </div>

      <MessageBanner message={message()} tone="success" />
      <MessageBanner message={currentError()} tone="error" />

      <section class="rounded border border-white/10 bg-slate-900 p-5">
        <h2 class="text-lg text-white mb-4">Selection</h2>
        <div class="grid gap-4 lg:grid-cols-3">
          <div class="grid gap-2">
            <label class="text-sm text-slate-300">Application</label>
            <select class="w-full rounded border border-white/10 bg-slate-950 px-3 py-2 text-sm" value={applicationId()} onInput={(event) => setApplicationId(event.currentTarget.value)}>
              <option value="">Select application</option>
              <For each={applicationsQuery.data ?? []}>{(item) => <option value={item.id}>{item.name}</option>}</For>
            </select>
          </div>
          <div class="grid gap-2">
            <label class="text-sm text-slate-300">Chain</label>
            <select class="w-full rounded border border-white/10 bg-slate-950 px-3 py-2 text-sm" value={chain()} onInput={(event) => setChain(event.currentTarget.value)}>
              <option value="">Select chain</option>
              <For each={chainsQuery.data ?? []}>{(item) => <option value={item}>{item}</option>}</For>
            </select>
          </div>
          <div class="grid gap-2">
            <label class="text-sm text-slate-300">Environment</label>
            <select class="w-full rounded border border-white/10 bg-slate-950 px-3 py-2 text-sm" value={environment()} onInput={(event) => setEnvironment(event.currentTarget.value)}>
              <For each={environmentsQuery.data ?? []}>{(item) => <option value={item}>{item}</option>}</For>
            </select>
          </div>
        </div>
      </section>

      <section class="rounded border border-white/10 bg-slate-900 p-5">
        <div class="flex justify-between items-start mb-4">
          <div>
            <h2 class="text-lg text-white">Quick Add</h2>
            <p class="text-sm text-slate-400">Create a new endpoint against the current selection.</p>
          </div>
          <A class="rounded border border-white/10 px-4 py-2 text-sm hover:bg-white/10" href="/endpoints/new">Open full editor</A>
        </div>
        <form class="grid gap-4 lg:grid-cols-3" onSubmit={addEndpoint}>
          <div class="grid gap-2">
            <label class="text-sm text-slate-300">Type</label>
            <select class="w-full rounded border border-white/10 bg-slate-950 px-3 py-2 text-sm" value={type()} onInput={(event) => setType(event.currentTarget.value)}>
              <For each={endpointTypesQuery.data ?? []}>{(item) => <option value={item}>{item}</option>}</For>
            </select>
          </div>
          <div class="grid gap-2">
            <label class="text-sm text-slate-300">Provider</label>
            <select class="w-full rounded border border-white/10 bg-slate-950 px-3 py-2 text-sm" value={providerId()} onInput={(event) => setProviderId(event.currentTarget.value)}>
              <option value="">Select provider</option>
              <For each={providersQuery.data ?? []}>{(item) => <option value={item.providerId}>{item.provider}</option>}</For>
            </select>
          </div>
          <div class="grid gap-2 lg:col-span-3">
            <label class="text-sm text-slate-300">Address</label>
            <input class="w-full rounded border border-white/10 bg-slate-950 px-3 py-2 text-sm" value={address()} onInput={(event) => setAddress(event.currentTarget.value)} />
          </div>
          <div class="lg:col-span-3">
            <button class="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-500 disabled:opacity-50" type="submit" disabled={!canQuery()}>Add RPC Endpoint</button>
          </div>
        </form>
      </section>

      <section class="rounded border border-white/10 bg-slate-900 p-5">
        <div class="mb-4">
          <h2 class="text-lg text-white">Matching Endpoints</h2>
          <p class="text-sm text-slate-400">Ordered by type, provider, and most recently updated.</p>
        </div>
        <Show when={rows().length > 0} fallback={<div class="rounded border border-dashed border-white/10 px-4 py-6 text-sm text-slate-400">No endpoints match the current selection.</div>}>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-white/10">
                  <th class="px-4 py-2 text-left text-xs text-slate-400">Type</th>
                  <th class="px-4 py-2 text-left text-xs text-slate-400">Provider</th>
                  <th class="px-4 py-2 text-left text-xs text-slate-400">Address</th>
                  <th class="px-4 py-2 text-left text-xs text-slate-400">Updated</th>
                  <th class="px-4 py-2 text-left text-xs text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                <For each={rows()}>{(row) => (
                  <tr class="border-b border-white/5">
                    <td class="px-4 py-3 text-slate-200">{row.type}</td>
                    <td class="px-4 py-3 text-slate-200">{row.provider}</td>
                    <td class="px-4 py-3 break-all font-mono text-xs text-slate-200">{row.address}</td>
                    <td class="px-4 py-3 text-slate-200">{new Date(row.updatedUtc).toLocaleString()}</td>
                    <td class="px-4 py-3">
                      <div class="flex gap-2">
                        <A class="rounded border border-white/10 px-3 py-1 text-sm hover:bg-white/10" href={`/endpoints/edit?type=${encodeURIComponent(row.type)}&id=${encodeURIComponent(row.id)}`}>Edit</A>
                        <button class="rounded bg-red-700 px-3 py-1 text-sm text-white hover:bg-red-600" type="button" onClick={() => removeEndpoint(row)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                )}</For>
              </tbody>
            </table>
          </div>
        </Show>
      </section>
    </div>
  );
}
