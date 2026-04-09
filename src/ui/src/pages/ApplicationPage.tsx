import { useParams } from "@solidjs/router";
import { createEffect, createMemo, createResource, createSignal, For, Show } from "solid-js";
import LoadingSpinner from "../components/LoadingSpinner";
import { useAuth } from "../lib/auth";

type Application = {
  id: string;
  name: string;
  apiKeyCount: number;
  tracingCount: number;
  realtimeCount: number;
  archiveCount: number;
};

type HostEnvironment = "Production" | "Development" | "Staging";

export default function ApplicationPage() {
  const auth = useAuth();
  const params = useParams();
  const applicationId = () => params.applicationId;

  const [selectedEnvironment, setSelectedEnvironment] = createSignal<HostEnvironment | undefined>(undefined);
  const [filterText, setFilterText] = createSignal("");

  // Set initial environment once data is loaded
  createEffect(() => {
    const envs = environments();
    if (envs && envs.length > 0 && !selectedEnvironment()) {
      setSelectedEnvironment(envs[0]);
    }
  });

  const [application] = createResource(
    () => ({ token: auth.token, id: applicationId() }),
    async ({ token, id }) => {
      if (!token || !id) return null;
      const response = await fetch("/api/applications", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        throw new Error("Failed to load application");
      }
      const apps = (await response.json()) as Application[];
      return apps.find((a) => a.id === id) || null;
    },
  );

  const [chains] = createResource(
    () => auth.token,
    async (token) => {
      if (!token) return [] as string[];
      const response = await fetch("/api/chains", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        throw new Error("Failed to load chains");
      }
      return response.json() as Promise<string[]>;
    },
  );

  const [environments] = createResource(
    () => auth.token,
    async (token) => {
      if (!token) return [] as HostEnvironment[];
      const response = await fetch("/api/host-environments", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        throw new Error("Failed to load environments");
      }
      return response.json() as Promise<HostEnvironment[]>;
    },
  );

  const filteredChains = createMemo(() => {
    const allChains = chains() ?? [];
    const filter = filterText().trim().toLowerCase();
    if (!filter) return allChains;
    return allChains.filter((chain) => chain.toLowerCase().includes(filter));
  });

  return (
    <main class="flex flex-1 flex-col">
      {/* Header Section */}
      <div class="border-b-4 border-[var(--color-b-ink)] bg-b-field px-6 py-8">
        <div class="mx-auto max-w-7xl">
          <Show when={application.state === "pending"}>
            <div class="flex items-center gap-3 text-sm font-semibold uppercase tracking-wider text-b-ink/70">
              <LoadingSpinner class="size-5" />
              Loading application…
            </div>
          </Show>

          <Show when={application.error}>
            <p class="border-4 border-red-500/50 bg-red-500/10 px-3 py-3 text-xs font-bold uppercase leading-snug text-red-400">
              {application.error.message}
            </p>
          </Show>

          <Show when={application() && application.state === "ready"}>
            <div class="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p class="mb-2 text-xs font-bold uppercase tracking-[0.4em] text-b-accent">
                  Application
                </p>
                <h1 class="font-['Anton',sans-serif] text-4xl uppercase leading-none tracking-wide text-b-ink sm:text-5xl">
                  {application()?.name}
                </h1>
              </div>

              {/* Host Environment Selector */}
              <div class="flex flex-col gap-2">
                <label
                  for="environment-select"
                  class="text-xs font-bold uppercase tracking-widest text-b-ink/80"
                >
                  Environment
                </label>
                <Show when={environments.state === "pending" || !selectedEnvironment()}>
                  <div class="flex h-12 items-center gap-2 border-4 border-[var(--color-b-ink)] bg-b-paper px-3 sm:w-48">
                    <LoadingSpinner class="size-4" />
                    <span class="text-xs font-bold uppercase tracking-widest text-b-ink/50">
                      Loading…
                    </span>
                  </div>
                </Show>
                <Show when={environments() && environments.state === "ready" && selectedEnvironment()}>
                  <div class="relative">
                    <select
                      id="environment-select"
                      value={selectedEnvironment()}
                      onChange={(e) =>
                        setSelectedEnvironment(e.currentTarget.value as HostEnvironment)
                      }
                      class="h-12 w-full appearance-none border-4 border-[var(--color-b-ink)] bg-b-paper px-3 pr-10 text-sm font-bold uppercase tracking-widest text-b-ink outline-none focus-visible:ring-4 focus-visible:ring-b-accent/50 hover:border-b-accent/50 transition-colors duration-200 cursor-pointer sm:w-48"
                    >
                      <For each={environments()}>
                        {(env) => <option value={env} class="bg-b-paper">{env}</option>}
                      </For>
                    </select>
                    <div class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                      <svg
                        class="size-5 text-b-ink/70"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="3"
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </div>
                </Show>
              </div>
            </div>
          </Show>
        </div>
      </div>

      {/* Chains Grid Section */}
      <div class="flex-1 px-6 py-8">
        <div class="mx-auto max-w-7xl">
          <Show when={chains.state === "pending"}>
            <div class="flex flex-col items-center justify-center gap-4 py-16">
              <LoadingSpinner class="size-8" />
              <p class="text-sm font-bold uppercase tracking-widest text-b-ink/80">
                Loading chains…
              </p>
            </div>
          </Show>

          <Show when={chains.error}>
            <div class="mx-auto max-w-md">
              <p class="border-4 border-red-500/50 bg-red-500/10 px-4 py-4 text-center text-xs font-bold uppercase leading-snug text-red-400">
                {chains.error.message}
              </p>
            </div>
          </Show>

          <Show when={chains() && chains.state === "ready"}>
            <div class="mb-6 flex items-center justify-between">
              <p class="text-xs font-bold uppercase tracking-[0.4em] text-b-accent">
                Select a Chain
              </p>
              <span class="text-xs font-bold uppercase tracking-widest text-b-ink/50">
                {filteredChains().length} / {chains()?.length} chains
              </span>
            </div>

            {/* Filter Textbox */}
            <div class="mb-6">
              <div class="relative">
                <input
                  type="text"
                  value={filterText()}
                  onInput={(e) => setFilterText(e.currentTarget.value)}
                  placeholder="Filter chains..."
                  class="h-12 w-full border-4 border-[var(--color-b-ink)] bg-b-paper px-4 pr-12 text-sm font-semibold text-b-ink placeholder:text-b-ink/30 outline-none focus-visible:ring-4 focus-visible:ring-b-accent/50 hover:border-b-accent/50 transition-colors duration-200"
                />
                <div class="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2">
                  <svg
                    class="size-5 text-b-ink/30"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              <For each={filteredChains()}>
                {(chain) => (
                  <button
                    type="button"
                    class="group relative flex flex-col items-start gap-3 border-4 border-[var(--color-b-ink)] bg-b-paper p-5 shadow-[6px_6px_0_0_rgba(232,228,220,0.08)] transition-all duration-200 hover:translate-x-1 hover:translate-y-1 hover:shadow-[3px_3px_0_0_rgba(255,87,34,0.2)] hover:border-b-accent/60 hover:bg-b-field focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-b-accent/50 active:translate-x-1.5 active:translate-y-1.5 active:shadow-none"
                  >
                    <div class="flex w-full items-center justify-between">
                      <span class="font-['Anton',sans-serif] text-xl uppercase tracking-wide text-b-ink group-hover:text-b-accent transition-colors duration-200">
                        {chain}
                      </span>
                      <div class="flex size-8 items-center justify-center border-2 border-[var(--color-b-ink)] bg-b-field transition-all duration-200 group-hover:bg-b-accent group-hover:border-b-accent group-hover:shadow-[0_0_12px_rgba(255,87,34,0.4)]">
                        <svg
                          class="size-4 text-b-ink transition-colors duration-200 group-hover:text-b-paper"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="3"
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                    </div>
                    <div class="h-1 w-12 bg-b-ink/60 transition-all duration-200 group-hover:w-full group-hover:bg-b-accent" />
                  </button>
                )}
              </For>
            </div>
          </Show>

          <Show when={chains() && chains.state === "ready" && chains()!.length === 0}>
            <div class="flex flex-col items-center justify-center gap-4 py-16">
              <p class="text-center text-sm font-semibold uppercase tracking-wider text-b-ink/60">
                No chains available.
              </p>
            </div>
          </Show>

          <Show when={chains() && chains.state === "ready" && chains()!.length > 0 && filteredChains().length === 0}>
            <div class="flex flex-col items-center justify-center gap-4 py-16">
              <p class="text-center text-sm font-semibold uppercase tracking-wider text-b-ink/60">
                No chains match your filter.
              </p>
            </div>
          </Show>
        </div>
      </div>
    </main>
  );
}
