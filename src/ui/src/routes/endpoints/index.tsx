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
      <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div class="space-y-2">
          <h1 class="text-3xl font-semibold tracking-tight text-white">Endpoints</h1>
          <p class="text-sm leading-6 text-slate-400">Browse the full endpoint inventory and jump into the focused editor for each record.</p>
        </div>
        <A class="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-blue-50 shadow-lg shadow-blue-950/40 transition hover:bg-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/50 disabled:pointer-events-none disabled:opacity-60" href="/endpoints/new">New Endpoint</A>
      </div>

      <MessageBanner message={currentError()} tone="error" />

      <section class="space-y-5 rounded-[1.5rem] border border-white/10 bg-slate-900/80 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.22)] backdrop-blur">
        <h2 class="text-xl font-semibold tracking-tight text-white">Filters</h2>
        <div class="grid gap-4 lg:grid-cols-3">
          <div class="grid gap-2">
            <label class="text-sm font-medium text-slate-300">Application</label>
            <select class="w-full appearance-none rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-slate-50 outline-none transition placeholder:text-slate-500 focus:border-blue-400/70 focus:ring-2 focus:ring-blue-500/30" value={applicationId()} onInput={(event) => setApplicationId(event.currentTarget.value)}>
              <option value="">All available</option>
              <For each={applicationsQuery.data ?? []}>{(item) => <option value={item.id}>{item.name}</option>}</For>
            </select>
          </div>
          <div class="grid gap-2">
            <label class="text-sm font-medium text-slate-300">Chain</label>
            <select class="w-full appearance-none rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-slate-50 outline-none transition placeholder:text-slate-500 focus:border-blue-400/70 focus:ring-2 focus:ring-blue-500/30" value={chainId()} onInput={(event) => setChainId(event.currentTarget.value)}>
              <option value="">All available</option>
              <For each={chainsQuery.data ?? []}>{(item) => <option value={item.id}>{item.name}</option>}</For>
            </select>
          </div>
          <div class="grid gap-2">
            <label class="text-sm font-medium text-slate-300">Environment</label>
            <select class="w-full appearance-none rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-slate-50 outline-none transition placeholder:text-slate-500 focus:border-blue-400/70 focus:ring-2 focus:ring-blue-500/30" value={environment()} onInput={(event) => setEnvironment(event.currentTarget.value)}>
              <For each={environmentsQuery.data ?? []}>{(item) => <option value={item}>{item}</option>}</For>
            </select>
          </div>
        </div>
      </section>

      <section class="overflow-hidden rounded-[1.5rem] border border-white/10 bg-slate-900/80 shadow-[0_24px_80px_rgba(0,0,0,0.22)] backdrop-blur">
        <div class="overflow-x-auto">
          <table class="min-w-full border-collapse text-sm">
            <thead class="bg-white/5"><tr><th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Application</th><th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Chain</th><th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Type</th><th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Provider</th><th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Address</th><th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Updated</th><th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Actions</th></tr></thead>
            <tbody>
              <For each={rowsQuery.data ?? []}>{(row) => (
                <tr>
                  <td class="border-t border-white/10 px-4 py-4 align-top text-slate-200">{row.application}</td>
                  <td class="border-t border-white/10 px-4 py-4 align-top text-slate-200">{row.chain}</td>
                  <td class="border-t border-white/10 px-4 py-4 align-top text-slate-200">{row.type}</td>
                  <td class="border-t border-white/10 px-4 py-4 align-top text-slate-200">{row.provider}</td>
                  <td class="border-t border-white/10 px-4 py-4 align-top break-all font-mono text-[0.95em] text-slate-200">{row.address}</td>
                  <td class="border-t border-white/10 px-4 py-4 align-top text-slate-200">{new Date(row.updatedUtc).toLocaleString()}</td>
                  <td class="border-t border-white/10 px-4 py-4 align-top text-slate-200"><A class="inline-flex items-center justify-center rounded-2xl bg-slate-700/80 px-4 py-2.5 text-sm font-semibold text-slate-50 transition hover:bg-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/50 disabled:pointer-events-none disabled:opacity-60" href={`/endpoints/edit?type=${encodeURIComponent(row.type)}&id=${encodeURIComponent(row.id)}`}>Edit</A></td>
                </tr>
              )}</For>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
