import { useNavigate, useParams } from "@solidjs/router";
import { createEffect, createMemo, createResource, createSignal, For, Show } from "solid-js";
import LoadingSpinner from "../components/LoadingSpinner";
import { useAuth } from "../lib/auth";
import ArrowLeftIcon from "../components/icons/ArrowLeftIcon";
import KeyIcon from "../components/icons/KeyIcon";
import RpcIcon from "../components/icons/RpcIcon";
import SettingsIcon from "../components/icons/SettingsIcon";
import CopyIcon from "../components/icons/CopyIcon";
import SearchIcon from "../components/icons/SearchIcon";
import ChevronDownIcon from "../components/icons/ChevronDownIcon";
import ChevronRightIcon from "../components/icons/ChevronRightIcon";
import TrashIcon from "../components/icons/TrashIcon";
import PencilIcon from "../components/icons/PencilIcon";
import LightningIcon from "../components/icons/LightningIcon";
import EmptyStateIcon from "../components/icons/EmptyStateIcon";

type Application = {
  id: string;
  name: string;
  apiKeyCount: number;
  tracingCount: number;
  realtimeCount: number;
  archiveCount: number;
};

type ConsumerApiKeySummary = {
  id: string;
  environment: string;
  key: string;
};

async function readErrorMessage(
  response: Response,
  fallback: string,
): Promise<string> {
  try {
    const data = (await response.json()) as {
      message?: string;
      errors?: Record<string, string[]>;
    };
    if (data.message && data.message !== "One or more errors occurred!")
      return data.message;
    const first = data.errors && Object.values(data.errors).flat()[0];
    if (first) return first;
  } catch {}
  if (response.status === 409)
    return "An application with this name already exists.";
  return fallback;
}

export default function ApplicationPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const params = useParams();
  const applicationId = () => params.applicationId;

  const [activeTab, setActiveTab] = createSignal<"rpcs" | "api-keys" | "general">("rpcs");

  const [selectedEnvironment, setSelectedEnvironment] = createSignal<
    string | undefined
  >(undefined);
  const [filterText, setFilterText] = createSignal("");

  const [renameName, setRenameName] = createSignal("");
  const [renameError, setRenameError] = createSignal<string | null>(null);
  const [renameLoading, setRenameLoading] = createSignal(false);

  const [deleteError, setDeleteError] = createSignal<string | null>(null);
  const [deleteLoading, setDeleteLoading] = createSignal(false);

  const [apiKeyToDelete, setApiKeyToDelete] =
    createSignal<ConsumerApiKeySummary | null>(null);
  const [newKeyEnvironment, setNewKeyEnvironment] = createSignal<
    string | undefined
  >(undefined);
  const [createKeyError, setCreateKeyError] = createSignal<string | null>(null);
  const [createKeyLoading, setCreateKeyLoading] = createSignal(false);
  const [deleteKeyError, setDeleteKeyError] = createSignal<string | null>(null);
  const [deleteKeyLoading, setDeleteKeyLoading] = createSignal(false);
  const [createdKey, setCreatedKey] = createSignal<string | null>(null);

  const [application, { refetch: refetchApplication }] = createResource(
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
      if (!token) return [] as string[];
      const response = await fetch("/api/host-environments", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        throw new Error("Failed to load environments");
      }
      return response.json() as Promise<string[]>;
    },
  );

  const [apiKeys, { refetch: refetchApiKeys }] = createResource(
    () => {
      if (activeTab() !== "api-keys") return undefined;
      const id = applicationId();
      const token = auth.token;
      if (!id || !token) return undefined;
      return { token, applicationId: id };
    },
    async (src) => {
      if (!src) return [] as ConsumerApiKeySummary[];
      const response = await fetch(
        `/api/applications/${src.applicationId}/api-keys`,
        { headers: { Authorization: `Bearer ${src.token}` } },
      );
      if (!response.ok) {
        throw new Error("Failed to load API keys");
      }
      return response.json() as Promise<ConsumerApiKeySummary[]>;
    },
  );

  createEffect(() => {
    const envs = environments();
    if (envs && envs.length > 0 && !selectedEnvironment()) {
      setSelectedEnvironment(envs[0]);
    }
  });

  createEffect(() => {
    const envs = environments();
    if (envs && envs.length > 0 && !newKeyEnvironment()) {
      setNewKeyEnvironment(envs[0]);
    }
  });

  const filteredChains = createMemo(() => {
    const allChains = chains() ?? [];
    const filter = filterText().trim().toLowerCase();
    if (!filter) return allChains;
    return allChains.filter((chain) => chain.toLowerCase().includes(filter));
  });

  const handleRename = async (e: SubmitEvent) => {
    e.preventDefault();
    const token = auth.token;
    const app = application();
    if (!token || !app) return;
    setRenameError(null);
    setRenameLoading(true);
    try {
      const response = await fetch(`/api/applications/${app.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: renameName() }),
      });
      if (!response.ok) {
        throw new Error(
          await readErrorMessage(response, "Failed to rename application"),
        );
      }
      await refetchApplication();
    } catch (err) {
      setRenameError(
        err instanceof Error ? err.message : "Failed to rename application",
      );
    } finally {
      setRenameLoading(false);
    }
  };

  const handleDeleteApplication = async () => {
    const token = auth.token;
    const app = application();
    if (!token || !app) return;
    setDeleteError(null);
    setDeleteLoading(true);
    try {
      const response = await fetch(`/api/applications/${app.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        throw new Error(
          await readErrorMessage(response, "Failed to delete application"),
        );
      }
      navigate("/", { replace: true });
    } catch (err) {
      setDeleteError(
        err instanceof Error ? err.message : "Failed to delete application",
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleCreateKey = async (e: SubmitEvent) => {
    e.preventDefault();
    const token = auth.token;
    const app = application();
    const env = newKeyEnvironment();
    if (!token || !app || !env) return;
    setCreateKeyError(null);
    setCreateKeyLoading(true);
    setCreatedKey(null);
    try {
      const response = await fetch(`/api/applications/${app.id}/api-keys`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ environment: env }),
      });
      if (!response.ok) {
        throw new Error(
          await readErrorMessage(response, "Failed to create API key"),
        );
      }
      const data = await response.json();
      setCreatedKey(data.key);
      await refetchApiKeys();
      await refetchApplication();
    } catch (err) {
      setCreateKeyError(
        err instanceof Error ? err.message : "Failed to create API key",
      );
    } finally {
      setCreateKeyLoading(false);
    }
  };

  const handleDeleteKey = async () => {
    const token = auth.token;
    const app = application();
    const key = apiKeyToDelete();
    if (!token || !app || !key) return;
    setDeleteKeyError(null);
    setDeleteKeyLoading(true);
    try {
      const response = await fetch(
        `/api/applications/${app.id}/api-keys/${key.id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!response.ok) {
        throw new Error(
          await readErrorMessage(response, "Failed to delete API key"),
        );
      }
      setApiKeyToDelete(null);
      await refetchApiKeys();
      await refetchApplication();
    } catch (err) {
      setDeleteKeyError(
        err instanceof Error ? err.message : "Failed to delete API key",
      );
    } finally {
      setDeleteKeyLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <main class="flex flex-1 flex-col">
      {/* Header Section */}
      <div class="border-b-4 border-[var(--color-b-ink)] bg-b-field px-6 py-4">
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
            <div class="flex flex-col gap-3">
              {/* Breadcrumb */}
              <button
                onClick={() => navigate("/")}
                class="group flex items-center gap-1.5 self-start text-[0.65rem] font-bold uppercase tracking-widest text-b-ink/50 transition-colors hover:text-b-accent"
              >
                <ArrowLeftIcon class="size-3.5 transition-transform group-hover:-translate-x-1" />
                Applications
              </button>

              {/* Title */}
              <h1 class="font-['Anton',sans-serif] text-3xl uppercase leading-none tracking-wide text-b-ink sm:text-4xl">
                {application()?.name}
              </h1>

              {/* Tab Navigation */}
              <div class="flex border-b-4 border-[var(--color-b-ink)]/20">
                <button
                  type="button"
                  onClick={() => setActiveTab("rpcs")}
                  class={`flex items-center gap-1.5 px-3 py-2 text-[0.65rem] font-bold uppercase tracking-widest transition-all duration-200 ${
                    activeTab() === "rpcs"
                      ? "border-b-4 border-b-accent bg-b-accent/10 text-b-accent"
                      : "text-b-ink/60 hover:bg-b-ink/5 hover:text-b-ink"
                  }`}
                >
                  <RpcIcon class="size-3.5" />
                  RPCs
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("api-keys")}
                  class={`flex items-center gap-1.5 px-3 py-2 text-[0.65rem] font-bold uppercase tracking-widest transition-all duration-200 ${
                    activeTab() === "api-keys"
                      ? "border-b-4 border-b-accent bg-b-accent/10 text-b-accent"
                      : "text-b-ink/60 hover:bg-b-ink/5 hover:text-b-ink"
                  }`}
                >
                  <KeyIcon class="size-3.5" />
                  API Keys
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("general")}
                  class={`flex items-center gap-1.5 px-3 py-2 text-[0.65rem] font-bold uppercase tracking-widest transition-all duration-200 ${
                    activeTab() === "general"
                      ? "border-b-4 border-b-accent bg-b-accent/10 text-b-accent"
                      : "text-b-ink/60 hover:bg-b-ink/5 hover:text-b-ink"
                  }`}
                >
                  <SettingsIcon class="size-3.5" />
                  General
                </button>
              </div>
            </div>
          </Show>
        </div>
      </div>

      {/* Tab Content */}
      <div class="flex-1 px-6 py-6">
        <div class="mx-auto max-w-7xl">
          {/* RPCs Tab */}
          <Show when={activeTab() === "rpcs"}>
            <div class="flex flex-col gap-6">
              {/* Environment Selector */}
              <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p class="text-xs font-bold uppercase tracking-[0.4em] text-b-accent">
                  Select Environment
                </p>
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
                        setSelectedEnvironment(e.currentTarget.value || undefined)
                      }
                      class="h-12 w-full appearance-none border-4 border-[var(--color-b-ink)] bg-b-paper px-3 pr-10 text-sm font-bold uppercase tracking-widest text-b-ink outline-none focus-visible:ring-4 focus-visible:ring-b-accent/50 hover:border-b-accent/50 transition-colors duration-200 cursor-pointer sm:w-48"
                    >
                      <For each={environments()}>
                        {(env) => <option value={env} class="bg-b-paper">{env}</option>}
                      </For>
                    </select>
                    <div class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                      <ChevronDownIcon class="size-5 text-b-ink/70" />
                    </div>
                  </div>
                </Show>
              </div>

              {/* Divider */}
              <div class="h-px bg-b-ink/10" />

              {/* Loading State */}
              <Show when={chains.state === "pending"}>
                <div class="flex flex-col items-center justify-center gap-4 py-16">
                  <LoadingSpinner class="size-8" />
                  <p class="text-sm font-bold uppercase tracking-widest text-b-ink/80">
                    Loading chains…
                  </p>
                </div>
              </Show>

              {/* Error State */}
              <Show when={chains.error}>
                <div class="mx-auto max-w-md">
                  <p class="border-4 border-red-500/50 bg-red-500/10 px-4 py-4 text-center text-xs font-bold uppercase leading-snug text-red-400">
                    {chains.error.message}
                  </p>
                </div>
              </Show>

              {/* Chains Content */}
              <Show when={chains() && chains.state === "ready"}>
                <div class="flex items-center justify-between">
                  <p class="text-xs font-bold uppercase tracking-[0.4em] text-b-accent">
                    Available Chains
                  </p>
                  <span class="text-xs font-bold uppercase tracking-widest text-b-ink/50">
                    {filteredChains().length} / {chains()?.length} chains
                  </span>
                </div>

                {/* Search Filter */}
                <div class="relative">
                  <input
                    type="text"
                    value={filterText()}
                    onInput={(e) => setFilterText(e.currentTarget.value)}
                    placeholder="Filter chains..."
                    class="h-12 w-full border-4 border-[var(--color-b-ink)] bg-b-paper px-4 pr-12 text-sm font-semibold text-b-ink placeholder:text-b-ink/30 outline-none focus-visible:ring-4 focus-visible:ring-b-accent/50 hover:border-b-accent/50 transition-colors duration-200"
                  />
                  <div class="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2">
                    <SearchIcon class="size-5 text-b-ink/30" />
                  </div>
                </div>

                {/* Chains Grid */}
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
                            <ChevronRightIcon class="size-4 text-b-ink transition-colors duration-200 group-hover:text-b-paper" />
                          </div>
                        </div>
                        <div class="h-1 w-12 bg-b-ink/60 transition-all duration-200 group-hover:w-full group-hover:bg-b-accent" />
                      </button>
                    )}
                  </For>
                </div>
              </Show>

              {/* Empty States */}
              <Show when={chains() && chains.state === "ready" && chains()!.length === 0}>
                <div class="flex flex-col items-center justify-center gap-4 py-16 border-4 border-dashed border-b-ink/20">
                  <LightningIcon class="size-12 text-b-ink/30" />
                  <p class="text-center text-sm font-semibold uppercase tracking-wider text-b-ink/60">
                    No chains available.
                  </p>
                </div>
              </Show>

              <Show when={chains() && chains.state === "ready" && chains()!.length > 0 && filteredChains().length === 0}>
                <div class="flex flex-col items-center justify-center gap-4 py-16 border-4 border-dashed border-b-ink/20">
                  <SearchIcon class="size-12 text-b-ink/30" />
                  <p class="text-center text-sm font-semibold uppercase tracking-wider text-b-ink/60">
                    No chains match your filter.
                  </p>
                </div>
              </Show>
            </div>
          </Show>

          {/* API Keys Tab */}
          <Show when={activeTab() === "api-keys"}>
            <div class="flex flex-col gap-6">
              {/* API Keys Section */}
              <section class="border-4 border-[var(--color-b-ink)] bg-b-field">
                <div class="border-b-4 border-[var(--color-b-ink)] bg-b-paper px-6 py-4">
                  <div class="flex items-center gap-3">
                    <div class="flex size-10 items-center justify-center border-2 border-[var(--color-b-accent)] bg-b-accent/10">
                      <KeyIcon class="size-5 text-b-accent" />
                    </div>
                    <div>
                      <h2 class="font-['Anton',sans-serif] text-xl uppercase tracking-wide text-b-ink">
                        API Keys
                      </h2>
                      <p class="text-xs font-bold uppercase tracking-widest text-b-ink/50">
                        Manage access keys per environment
                      </p>
                    </div>
                  </div>
                </div>

                <div class="p-6">
                  {/* Loading State */}
                  <Show when={apiKeys.state === "pending"}>
                    <div class="flex items-center justify-center gap-3 py-8 text-xs font-bold uppercase tracking-widest text-b-ink/80">
                      <LoadingSpinner class="size-4" />
                      Loading keys…
                    </div>
                  </Show>

                  {/* Error State */}
                  <Show when={apiKeys.error}>
                    <p class="border-4 border-red-500/50 bg-red-500/10 px-3 py-3 text-xs font-bold uppercase leading-snug text-red-400">
                      {apiKeys.error.message}
                    </p>
                  </Show>

                  {/* Keys List */}
                  <Show when={apiKeys() && apiKeys.state === "ready" && (apiKeys() ?? []).length > 0}>
                    <div class="mb-6">
                      <p class="mb-3 text-xs font-bold uppercase tracking-widest text-b-ink/50">
                        Active Keys
                      </p>
                      <ul class="flex flex-col gap-3">
                        <For each={apiKeys()}>
                          {(k) => (
                            <li class="flex flex-col gap-3 border-4 border-[var(--color-b-ink)] bg-b-paper p-4 sm:flex-row sm:items-center sm:justify-between">
                              <div class="min-w-0 flex-1">
                                <div class="flex items-center gap-2">
                                  <span class="inline-flex items-center rounded bg-b-accent/10 px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-b-accent">
                                    {k.environment}
                                  </span>
                                </div>
                                <div class="mt-2 flex items-center gap-2">
                                  <code class="break-all font-mono text-xs font-semibold text-b-ink">
                                    {k.key}
                                  </code>
                                  <button
                                    type="button"
                                    onClick={() => copyToClipboard(k.key)}
                                    class="shrink-0 text-b-ink/40 hover:text-b-accent transition-colors"
                                    title="Copy to clipboard"
                                  >
                                    <CopyIcon class="size-4" />
                                  </button>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setDeleteKeyError(null);
                                  setApiKeyToDelete(k);
                                }}
                                disabled={createKeyLoading() || deleteKeyLoading()}
                                class="btn btn-sm btn-interactive btn-disabled btn-danger shrink-0"
                              >
                                Revoke
                              </button>
                            </li>
                          )}
                        </For>
                      </ul>
                    </div>
                  </Show>

                  {/* No Keys State */}
                  <Show when={apiKeys() && apiKeys.state === "ready" && (apiKeys() ?? []).length === 0}>
                    <div class="mb-6 flex flex-col items-center justify-center gap-3 py-8 border-4 border-dashed border-b-ink/20">
                      <EmptyStateIcon class="size-10 text-b-ink/30" />
                      <p class="text-sm font-semibold uppercase tracking-wider text-b-ink/60">
                        No API keys yet.
                      </p>
                    </div>
                  </Show>

                  {/* Create New Key */}
                  <div class="border-t-4 border-[var(--color-b-ink)]/20 pt-6">
                    <p class="mb-4 text-xs font-bold uppercase tracking-widest text-b-ink/50">
                      Create New Key
                    </p>
                    <form onSubmit={handleCreateKey} class="flex flex-col gap-4">
                      <div class="flex flex-col gap-2 sm:flex-row sm:items-end">
                        <div class="flex-1">
                          <label
                            for="new-key-environment"
                            class="mb-2 block text-xs font-bold uppercase tracking-widest text-b-ink/80"
                          >
                            Environment
                          </label>
                          <Show when={environments.state === "pending" || !newKeyEnvironment()}>
                            <div class="flex h-12 items-center gap-2 border-4 border-[var(--color-b-ink)] bg-b-paper px-3">
                              <LoadingSpinner class="size-4" />
                              <span class="text-xs font-bold uppercase tracking-widest text-b-ink/50">
                                Loading…
                              </span>
                            </div>
                          </Show>
                          <Show when={environments() && environments.state === "ready" && newKeyEnvironment()}>
                            <select
                              id="new-key-environment"
                              value={newKeyEnvironment()}
                              onChange={(e) =>
                                setNewKeyEnvironment(e.currentTarget.value || undefined)
                              }
                              class="h-12 w-full appearance-none border-4 border-[var(--color-b-ink)] bg-b-paper px-3 pr-10 text-sm font-bold uppercase tracking-widest text-b-ink outline-none focus-visible:ring-4 focus-visible:ring-b-accent/50 hover:border-b-accent/50 transition-colors duration-200 cursor-pointer"
                            >
                              <For each={environments()}>
                                {(env) => (
                                  <option value={env} class="bg-b-paper">
                                    {env}
                                  </option>
                                )}
                              </For>
                            </select>
                          </Show>
                        </div>
                        <button
                          type="submit"
                          disabled={createKeyLoading() || !newKeyEnvironment()}
                          class="btn btn-md btn-interactive btn-disabled btn-primary h-12"
                        >
                          <Show when={createKeyLoading()}>
                            <LoadingSpinner class="size-3.5 text-b-paper" />
                          </Show>
                          {createKeyLoading() ? "Creating…" : "Create Key"}
                        </button>
                      </div>

                      {/* Created Key Display */}
                      <Show when={createdKey()}>
                        <div class="border-4 border-b-accent/50 bg-b-accent/10 p-4">
                          <p class="mb-2 text-xs font-bold uppercase tracking-widest text-b-accent">
                            New API Key Created
                          </p>
                          <div class="flex items-center gap-2">
                            <code class="flex-1 break-all font-mono text-sm font-semibold text-b-ink">
                              {createdKey()}
                            </code>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(createdKey()!)}
                              class="shrink-0 text-b-ink/60 hover:text-b-accent transition-colors"
                              title="Copy to clipboard"
                            >
                              <CopyIcon class="size-5" />
                            </button>
                          </div>
                          <p class="mt-2 text-xs text-b-ink/50">
                            Copy this key now. You won't be able to see it again.
                          </p>
                        </div>
                      </Show>

                      <Show when={createKeyError()}>
                        <p class="border-4 border-red-500/50 bg-red-500/10 px-3 py-3 text-xs font-bold uppercase leading-snug text-red-400">
                          {createKeyError()}
                        </p>
                      </Show>
                    </form>
                  </div>
                </div>
              </section>
            </div>
          </Show>

          {/* General Settings Tab */}
          <Show when={activeTab() === "general"}>
            <div class="flex flex-col gap-8">
              {/* Rename Section */}
              <section class="border-4 border-[var(--color-b-ink)] bg-b-field">
                <div class="border-b-4 border-[var(--color-b-ink)] bg-b-paper px-6 py-4">
                  <div class="flex items-center gap-3">
                    <div class="flex size-10 items-center justify-center border-2 border-b-ink/50 bg-b-ink/10">
                      <PencilIcon class="size-5 text-b-ink" />
                    </div>
                    <div>
                      <h2 class="font-['Anton',sans-serif] text-xl uppercase tracking-wide text-b-ink">
                        Rename Application
                      </h2>
                      <p class="text-xs font-bold uppercase tracking-widest text-b-ink/50">
                        Change the display name
                      </p>
                    </div>
                  </div>
                </div>

                <div class="p-6">
                  <form onSubmit={handleRename} class="flex flex-col gap-4">
                    <div class="flex flex-col gap-2 sm:flex-row sm:items-end">
                      <div class="flex-1">
                        <label
                          for="rename-app-name"
                          class="mb-2 block text-xs font-bold uppercase tracking-widest text-b-ink/80"
                        >
                          Application Name
                        </label>
                        <input
                          id="rename-app-name"
                          type="text"
                          required
                          value={renameName() || application()?.name || ""}
                          onInput={(e) => setRenameName(e.currentTarget.value)}
                          class="h-12 w-full border-4 border-[var(--color-b-ink)] bg-b-paper px-3 text-sm font-semibold text-b-ink placeholder:text-b-ink/30 outline-none focus-visible:ring-4 focus-visible:ring-b-accent/50 hover:border-b-accent/50 transition-colors duration-200"
                          placeholder="MY APPLICATION"
                          autocomplete="off"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={renameLoading()}
                        class="btn btn-md btn-interactive btn-disabled btn-primary h-12"
                      >
                        <Show when={renameLoading()}>
                          <LoadingSpinner class="size-3.5 text-b-paper" />
                        </Show>
                        {renameLoading() ? "Saving…" : "Rename"}
                      </button>
                    </div>

                    <Show when={renameError()}>
                      <p class="border-4 border-red-500/50 bg-red-500/10 px-3 py-3 text-xs font-bold uppercase leading-snug text-red-400">
                        {renameError()}
                      </p>
                    </Show>
                  </form>
                </div>
              </section>

              {/* Delete Section */}
              <section class="border-4 border-red-500/50 bg-b-field">
                <div class="border-b-4 border-red-500/50 bg-red-500/10 px-6 py-4">
                  <div class="flex items-center gap-3">
                    <div class="flex size-10 items-center justify-center border-2 border-red-500 bg-red-500/20">
                      <TrashIcon class="size-5 text-red-400" />
                    </div>
                    <div>
                      <h2 class="font-['Anton',sans-serif] text-xl uppercase tracking-wide text-red-400">
                        Delete Application
                      </h2>
                      <p class="text-xs font-bold uppercase tracking-widest text-red-400/60">
                        Permanently remove this application
                      </p>
                    </div>
                  </div>
                </div>

                <div class="p-6">
                  <p class="mb-4 text-sm text-b-ink/80">
                    Once deleted, this application and all its associated data will be permanently removed. This action cannot be undone.
                  </p>

                  <Show when={deleteError()}>
                    <p class="mb-4 border-4 border-red-500/50 bg-red-500/10 px-3 py-3 text-xs font-bold uppercase leading-snug text-red-400">
                      {deleteError()}
                    </p>
                  </Show>

                  <button
                    type="button"
                    onClick={() => setDeleteLoading(true)}
                    disabled={deleteLoading()}
                    class="btn btn-md btn-interactive btn-disabled btn-danger"
                  >
                    <Show when={deleteLoading()}>
                      <LoadingSpinner class="size-3.5" />
                    </Show>
                    {deleteLoading() ? "Deleting…" : "Delete Application"}
                  </button>
                </div>
              </section>
            </div>
          </Show>
        </div>
      </div>

      {/* Delete Application Confirmation Modal */}
      <Show when={deleteLoading() && activeTab() === "general"}>
        <div
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4 py-8"
          role="presentation"
          onClick={() => setDeleteLoading(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-application-title"
            class="w-full max-w-md border-4 border-red-500/50 bg-b-field p-8 shadow-[12px_12px_0_0_rgba(239,68,68,0.15)]"
            onClick={(e) => e.stopPropagation()}
          >
            <p class="mb-2 text-xs font-bold uppercase tracking-[0.35em] text-red-400">
              Confirm Deletion
            </p>
            <h3
              id="delete-application-title"
              class="mb-4 font-['Anton',sans-serif] text-4xl uppercase leading-none tracking-wide text-b-ink"
            >
              Delete Application
            </h3>
            <p class="mb-8 text-sm font-semibold text-b-ink/80">
              Permanently delete{" "}
              <span class="font-bold text-red-400">{application()?.name}</span>? This
              cannot be undone.
            </p>

            <Show when={deleteError()}>
              <p class="mb-6 border-4 border-red-500/50 bg-red-500/10 px-3 py-3 text-xs font-bold uppercase leading-snug text-red-400">
                {deleteError()}
              </p>
            </Show>

            <div class="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setDeleteLoading(false)}
                class="btn btn-md btn-interactive btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteApplication}
                class="btn btn-md btn-interactive btn-danger"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </Show>

      {/* Revoke Key Confirmation Modal */}
      <Show when={apiKeyToDelete()}>
        <div
          class="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4 py-8"
          role="presentation"
          onClick={() => setApiKeyToDelete(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-api-key-title"
            class="w-full max-w-md border-4 border-red-500/50 bg-b-field p-8 shadow-[12px_12px_0_0_rgba(239,68,68,0.15)]"
            onClick={(e) => e.stopPropagation()}
          >
            <p class="mb-2 text-xs font-bold uppercase tracking-[0.35em] text-red-400">
              Revoke Key
            </p>
            <h3
              id="delete-api-key-title"
              class="mb-4 font-['Anton',sans-serif] text-4xl uppercase leading-none tracking-wide text-b-ink"
            >
              API key
            </h3>
            <p class="mb-4 text-sm font-semibold text-b-ink/80">
              Permanently revoke this key for{" "}
              <span class="font-bold text-red-400">
                {apiKeyToDelete()!.environment}
              </span>
              ?
            </p>
            <p class="mb-8 text-xs text-b-ink/50">
              Clients using this key will stop working immediately.
            </p>

            <Show when={deleteKeyError()}>
              <p class="mb-6 border-4 border-red-500/50 bg-red-500/10 px-3 py-3 text-xs font-bold uppercase leading-snug text-red-400">
                {deleteKeyError()}
              </p>
            </Show>

            <div class="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setApiKeyToDelete(null)}
                disabled={deleteKeyLoading()}
                class="btn btn-md btn-interactive btn-disabled btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteKey}
                disabled={deleteKeyLoading()}
                class="btn btn-md btn-interactive btn-disabled btn-danger"
              >
                <Show when={deleteKeyLoading()}>
                  <LoadingSpinner class="size-3.5" />
                </Show>
                {deleteKeyLoading() ? "Revoking…" : "Revoke key"}
              </button>
            </div>
          </div>
        </div>
      </Show>
    </main>
  );
}
