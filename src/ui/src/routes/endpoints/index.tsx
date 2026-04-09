import { createQuery } from "@tanstack/solid-query";
import { A } from "@solidjs/router";
import { For, createSignal } from "solid-js";
import { MessageBanner } from "../../components/MessageBanner";
import { getApplications, getChains, getEndpoints, getEnvironmentLookups } from "../../lib/api";
import { queryKeys } from "../../lib/query";
import type { HostEnvironment } from "../../lib/types";

export default function EndpointsPage() {
  const [applicationId, setApplicationId] = createSignal("");
  const [chainId, setChainId] = createSignal("");
  const [environment, setEnvironment] = createSignal<HostEnvironment>("Development");
  const applicationsQuery = createQuery(() => ({
    queryKey: queryKeys.applications,
    queryFn: getApplications,
  }));
  const chainsQuery = createQuery(() => ({
    queryKey: queryKeys.chains,
    queryFn: getChains,
  }));
  const environmentsQuery = createQuery(() => ({
    queryKey: queryKeys.environments,
    queryFn: getEnvironmentLookups,
  }));
  const rowsQuery = createQuery(() => ({
    queryKey: queryKeys.endpoints(applicationId() || undefined, chainId() || undefined, environment()),
    queryFn: () => getEndpoints({ applicationId: applicationId() || undefined, chainId: chainId() || undefined, environment: environment() }),
  }));
  const currentError = () => (applicationsQuery.error instanceof Error ? applicationsQuery.error.message : null)
    ?? (chainsQuery.error instanceof Error ? chainsQuery.error.message : null)
    ?? (environmentsQuery.error instanceof Error ? environmentsQuery.error.message : null)
    ?? (rowsQuery.error instanceof Error ? rowsQuery.error.message : null);

  return (
    <div class="space-y-6">
      <div class="flex justify-between items-start">
        <div>
          <h1 class="text-2xl text-white">Endpoints</h1>
          <p class="text-sm text-slate-400">Browse the full endpoint inventory and jump into the focused editor for each record.</p>
        </div>
        <A class="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-500" href="/endpoints/new">New Endpoint</A>
      </div>

      <MessageBanner message={currentError()} tone="error" />

      <section class="rounded border border-white/10 bg-slate-900 p-5">
        <h2 class="text-lg text-white mb-4">Filters</h2>
        <div class="grid gap-4 lg:grid-cols-3">
          <div class="grid gap-2">
            <label class="text-sm text-slate-300">Application</label>
            <select class="w-full rounded border border-white/10 bg-slate-950 px-3 py-2 text-sm" value={applicationId()} onInput={(event) => setApplicationId(event.currentTarget.value)}>
              <option value="">All available</option>
              <For each={applicationsQuery.data ?? []}>{(item) => <option value={item.id}>{item.name}</option>}</For>
            </select>
          </div>
          <div class="grid gap-2">
            <label class="text-sm text-slate-300">Chain</label>
            <select class="w-full rounded border border-white/10 bg-slate-950 px-3 py-2 text-sm" value={chainId()} onInput={(event) => setChainId(event.currentTarget.value)}>
              <option value="">All available</option>
              <For each={chainsQuery.data ?? []}>{(item) => <option value={item.id}>{item.name}</option>}</For>
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
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-white/10">
                <th class="px-4 py-2 text-left text-xs text-slate-400">Application</th>
                <th class="px-4 py-2 text-left text-xs text-slate-400">Chain</th>
                <th class="px-4 py-2 text-left text-xs text-slate-400">Type</th>
                <th class="px-4 py-2 text-left text-xs text-slate-400">Provider</th>
                <th class="px-4 py-2 text-left text-xs text-slate-400">Address</th>
                <th class="px-4 py-2 text-left text-xs text-slate-400">Updated</th>
                <th class="px-4 py-2 text-left text-xs text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              <For each={rowsQuery.data ?? []}>{(row) => (
                <tr class="border-b border-white/5">
                  <td class="px-4 py-3 text-slate-200">{row.application}</td>
                  <td class="px-4 py-3 text-slate-200">{row.chain}</td>
                  <td class="px-4 py-3 text-slate-200">{row.type}</td>
                  <td class="px-4 py-3 text-slate-200">{row.provider}</td>
                  <td class="px-4 py-3 break-all font-mono text-xs text-slate-200">{row.address}</td>
                  <td class="px-4 py-3 text-slate-200">{new Date(row.updatedUtc).toLocaleString()}</td>
                  <td class="px-4 py-3"><A class="rounded border border-white/10 px-3 py-1 text-sm hover:bg-white/10" href={`/endpoints/edit?type=${encodeURIComponent(row.type)}&id=${encodeURIComponent(row.id)}`}>Edit</A></td>
                </tr>
              )}</For>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
