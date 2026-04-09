import { useNavigate, useParams } from "@solidjs/router";
import { createEffect, createMemo, createSignal, For, Show } from "solid-js";
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
import ProviderIcon from "../components/icons/ProviderIcon";
import {
  useReferenceData,
  type RpcProviderSummary,
} from "../lib/reference-data";
import {
  useApplicationData,
  type ConsumerApiKeySummary,
} from "../lib/application-data";

async function readErrorMessage(
  response: Response,
  fallback: string,
  conflictHint?: string,
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
    return conflictHint ?? "An application with this name already exists.";
  return fallback;
}

const applicationNamePattern = "[A-Za-z0-9_-]+";
const applicationNameHint =
  "Use only letters, numbers, underscores, and hyphens.";

export default function ApplicationPage() {
  const auth = useAuth();
  const referenceData = useReferenceData();
  const applicationData = useApplicationData();
  const navigate = useNavigate();
  const params = useParams();
  const applicationId = () => params.applicationId;

  const applications = referenceData.applications.data;
  const applicationsState = referenceData.applications.state;
  const applicationsError = referenceData.applications.error;
  const chains = referenceData.chains.data;
  const chainsState = referenceData.chains.state;
  const chainsError = referenceData.chains.error;
  const environments = referenceData.hostEnvironments.data;
  const environmentsState = referenceData.hostEnvironments.state;
  const environmentsError = referenceData.hostEnvironments.error;
  const apiKeys = applicationData.apiKeys.data;
  const apiKeysState = applicationData.apiKeys.state;
  const apiKeysError = applicationData.apiKeys.error;
  const providers = referenceData.rpcProviders.data;
  const providersState = referenceData.rpcProviders.state;
  const providersError = referenceData.rpcProviders.error;

  const [activeTab, setActiveTab] = createSignal<
    "rpcs" | "api-keys" | "general" | "providers"
  >("rpcs");

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

  const [createKeyModalOpen, setCreateKeyModalOpen] = createSignal(false);

  const [providerModalOpen, setProviderModalOpen] = createSignal(false);
  const [newProviderName, setNewProviderName] = createSignal("");
  const [newProviderRateLimit, setNewProviderRateLimit] = createSignal("100");
  const [createProviderError, setCreateProviderError] = createSignal<
    string | null
  >(null);
  const [createProviderLoading, setCreateProviderLoading] = createSignal(false);

  const [providerToDelete, setProviderToDelete] =
    createSignal<RpcProviderSummary | null>(null);
  const [deleteProviderError, setDeleteProviderError] = createSignal<
    string | null
  >(null);
  const [deleteProviderLoading, setDeleteProviderLoading] = createSignal(false);

  const application = createMemo(
    () => applications().find((app) => app.id === applicationId()) ?? null,
  );

  createEffect(() => {
    const envs = environments();
    const selected = selectedEnvironment();
    if (envs.length > 0 && (!selected || !envs.includes(selected))) {
      setSelectedEnvironment(envs[0]);
    }
  });

  createEffect(() => {
    const envs = environments();
    const selected = newKeyEnvironment();
    if (envs.length > 0 && (!selected || !envs.includes(selected))) {
      setNewKeyEnvironment(envs[0]);
    }
  });

  const availableChains = createMemo(() => {
    const uniqueChains = new Set(chains());
    return Array.from(uniqueChains).sort((a, b) => a.localeCompare(b));
  });

  const filteredChains = createMemo(() => {
    const allChains = availableChains();
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
      await referenceData.refreshApplications();
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
      referenceData.removeApplication(app.id);
      navigate("/", { replace: true });
      void referenceData.refreshApplications();
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
      await Promise.all([
        applicationData.refreshApiKeys(),
        referenceData.refreshApplications(),
      ]);
      setCreateKeyModalOpen(false);
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
      await Promise.all([
        applicationData.refreshApiKeys(),
        referenceData.refreshApplications(),
      ]);
    } catch (err) {
      setDeleteKeyError(
        err instanceof Error ? err.message : "Failed to delete API key",
      );
    } finally {
      setDeleteKeyLoading(false);
    }
  };

  const openCreateKeyModal = () => {
    setCreateKeyError(null);
    setCreateKeyModalOpen(true);
  };

  const closeCreateKeyModal = () => {
    if (createKeyLoading()) return;
    setCreateKeyModalOpen(false);
  };

  const openProviderModal = () => {
    setCreateProviderError(null);
    setNewProviderName("");
    setNewProviderRateLimit("100");
    setProviderModalOpen(true);
  };

  const closeProviderModal = () => {
    if (createProviderLoading()) return;
    setProviderModalOpen(false);
  };

  const handleCreateProvider = async (e: SubmitEvent) => {
    e.preventDefault();
    const token = auth.token;
    if (!token) return;
    setCreateProviderError(null);
    setCreateProviderLoading(true);
    try {
      const rateLimit = Number(newProviderRateLimit());
      if (!Number.isFinite(rateLimit) || rateLimit <= 0) {
        throw new Error("Rate limit must be a positive number.");
      }
      const response = await fetch("/api/rpc-providers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newProviderName(),
          rateLimit,
        }),
      });
      if (!response.ok) {
        throw new Error(
          await readErrorMessage(
            response,
            "Failed to create RPC provider",
            "An RPC provider with this name already exists.",
          ),
        );
      }
      setProviderModalOpen(false);
      setNewProviderName("");
      setNewProviderRateLimit("100");
      await referenceData.refreshRpcProviders();
    } catch (err) {
      setCreateProviderError(
        err instanceof Error ? err.message : "Failed to create RPC provider",
      );
    } finally {
      setCreateProviderLoading(false);
    }
  };

  const handleDeleteRpcProvider = async () => {
    const token = auth.token;
    const provider = providerToDelete();
    if (!token || !provider) return;
    setDeleteProviderError(null);
    setDeleteProviderLoading(true);
    try {
      const response = await fetch(`/api/rpc-providers/${provider.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        throw new Error(
          await readErrorMessage(response, "Failed to delete RPC provider"),
        );
      }
      setProviderToDelete(null);
      await referenceData.refreshRpcProviders();
    } catch (err) {
      setDeleteProviderError(
        err instanceof Error ? err.message : "Failed to delete RPC provider",
      );
    } finally {
      setDeleteProviderLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <main class="flex flex-1 flex-col">
      {/* Header Section */}
      <div class="border-b border-b-border bg-b-field/50 px-6 py-4">
        <div class="mx-auto max-w-7xl">
          <Show when={applicationsState() === "pending"}>
            <div class="flex items-center gap-3 text-sm font-semibold uppercase tracking-wider text-b-ink/70">
              <LoadingSpinner class="size-5" />
              Loading application…
            </div>
          </Show>

          <Show when={applicationsError()}>
            <p class="border-4 border-red-500/50 bg-red-500/10 px-3 py-3 text-xs font-bold uppercase leading-snug text-red-400">
              {applicationsError()!.message}
            </p>
          </Show>

          <Show when={application() && applicationsState() === "ready"}>
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
              <div class="flex border-b border-b-border/50">
                <button
                  type="button"
                  onClick={() => setActiveTab("rpcs")}
                  class={`flex items-center gap-1.5 px-4 py-3 text-[0.65rem] font-bold uppercase tracking-widest transition-all duration-200 ${
                    activeTab() === "rpcs"
                      ? "border-b-2 border-b-accent bg-b-accent/5 text-b-accent"
                      : "text-b-ink/50 hover:text-b-ink hover:bg-b-ink/5"
                  }`}
                >
                  <RpcIcon class="size-3.5" />
                  RPCs
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("api-keys")}
                  class={`flex items-center gap-1.5 px-4 py-3 text-[0.65rem] font-bold uppercase tracking-widest transition-all duration-200 ${
                    activeTab() === "api-keys"
                      ? "border-b-2 border-b-accent bg-b-accent/5 text-b-accent"
                      : "text-b-ink/50 hover:text-b-ink hover:bg-b-ink/5"
                  }`}
                >
                  <KeyIcon class="size-3.5" />
                  API Keys
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("general")}
                  class={`flex items-center gap-1.5 px-4 py-3 text-[0.65rem] font-bold uppercase tracking-widest transition-all duration-200 ${
                    activeTab() === "general"
                      ? "border-b-2 border-b-accent bg-b-accent/5 text-b-accent"
                      : "text-b-ink/50 hover:text-b-ink hover:bg-b-ink/5"
                  }`}
                >
                  <SettingsIcon class="size-3.5" />
                  General
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("providers")}
                  class={`flex items-center gap-1.5 px-4 py-3 text-[0.65rem] font-bold uppercase tracking-widest transition-all duration-200 ${
                    activeTab() === "providers"
                      ? "border-b-2 border-b-accent bg-b-accent/5 text-b-accent"
                      : "text-b-ink/50 hover:text-b-ink hover:bg-b-ink/5"
                  }`}
                >
                  <ProviderIcon class="size-3.5" />
                  Providers
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
                <Show when={environmentsState() === "pending"}>
                  <div class="flex h-11 items-center gap-2 border border-b-border bg-b-field px-3 sm:w-48">
                    <LoadingSpinner class="size-4" />
                    <span class="text-xs font-bold uppercase tracking-widest text-b-ink/50">
                      Loading…
                    </span>
                  </div>
                </Show>
                <Show when={environmentsError()}>
                  <p class="border border-red-500/40 bg-red-500/10 px-3 py-3 text-xs font-bold uppercase leading-snug text-red-400 sm:w-72">
                    {environmentsError()!.message}
                  </p>
                </Show>
                <Show
                  when={
                    environmentsState() === "ready" && selectedEnvironment()
                  }
                >
                  <div class="relative">
                    <select
                      id="environment-select"
                      value={selectedEnvironment()}
                      onChange={(e) =>
                        setSelectedEnvironment(
                          e.currentTarget.value || undefined,
                        )
                      }
                      class="h-11 w-full appearance-none border border-b-border bg-b-field px-4 pr-10 text-sm font-bold uppercase tracking-widest text-b-ink outline-none focus-visible:border-b-accent/50 focus-visible:ring-2 focus-visible:ring-b-accent/20 hover:border-b-border-hover transition-all duration-200 cursor-pointer sm:w-48"
                    >
                      <For each={environments()}>
                        {(env) => (
                          <option value={env} class="bg-b-field">
                            {env}
                          </option>
                        )}
                      </For>
                    </select>
                    <div class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                      <ChevronDownIcon class="size-5 text-b-ink/50" />
                    </div>
                  </div>
                </Show>
              </div>

                {/* Divider */}
              <div class="h-px bg-gradient-to-r from-transparent via-b-border to-transparent" />

              {/* Loading State */}
              <Show when={chainsState() === "pending"}>
                <div class="flex flex-col items-center justify-center gap-4 py-16">
                  <LoadingSpinner class="size-8" />
                  <p class="text-sm font-bold uppercase tracking-widest text-b-ink/80">
                    Loading chains…
                  </p>
                </div>
              </Show>

              <Show when={chainsState() === "refreshing"}>
                <div class="flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-b-ink/80">
                  <LoadingSpinner class="size-4" />
                  Updating chains…
                </div>
              </Show>

              {/* Error State */}
              <Show when={chainsError()}>
                <div class="mx-auto max-w-md">
                  <p class="border-4 border-red-500/50 bg-red-500/10 px-4 py-4 text-center text-xs font-bold uppercase leading-snug text-red-400">
                    {chainsError()!.message}
                  </p>
                </div>
              </Show>

              {/* Chains Content */}
              <Show
                when={
                  !chainsError() &&
                  (chainsState() === "ready" || chainsState() === "refreshing")
                }
              >
                <div class="flex items-center justify-between">
                  <p class="text-xs font-bold uppercase tracking-[0.4em] text-b-accent">
                    Available Chains
                  </p>
                  <span class="text-xs font-bold uppercase tracking-widest text-b-ink/50">
                    {filteredChains().length} / {availableChains().length}{" "}
                    chains
                  </span>
                </div>

                {/* Search Filter */}
                <div class="relative">
                  <input
                    type="text"
                    value={filterText()}
                    onInput={(e) => setFilterText(e.currentTarget.value)}
                    placeholder="Filter chains..."
                    class="h-11 w-full border border-b-border bg-b-paper px-4 pr-12 text-sm font-semibold text-b-ink placeholder:text-b-ink/25 outline-none focus-visible:border-b-accent/50 focus-visible:ring-2 focus-visible:ring-b-accent/20 hover:border-b-border-hover transition-all duration-200"
                  />
                  <div class="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2">
                    <SearchIcon class="size-5 text-b-ink/30" />
                  </div>
                </div>

                {/* Chains Grid */}
                <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  <For each={filteredChains()}>
                    {(chain) => (
                      <button
                        type="button"
                        class="group relative flex items-center justify-between border border-b-border bg-b-field px-5 py-4 transition-all duration-200 hover:border-b-accent/40 hover:bg-b-paper hover:shadow-[0_4px_20px_rgba(255,87,34,0.12)] hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-b-accent/50 active:translate-y-0"
                      >
                        <span class="font-['Anton',sans-serif] text-lg uppercase tracking-wide text-b-ink group-hover:text-b-accent transition-colors duration-200">
                          {chain}
                        </span>
                        <div class="flex size-7 items-center justify-center border border-b-border bg-b-paper/50 transition-all duration-200 group-hover:bg-b-accent group-hover:border-b-accent">
                          <ChevronRightIcon class="size-4 text-b-ink/60 transition-colors duration-200 group-hover:text-b-paper" />
                        </div>
                      </button>
                    )}
                  </For>
                </div>
              </Show>

              {/* Empty States */}
              <Show
                when={
                  !chainsError() &&
                  (chainsState() === "ready" ||
                    chainsState() === "refreshing") &&
                  availableChains().length === 0
                }
              >
                <div class="flex flex-col items-center justify-center gap-4 py-16 border border-dashed border-b-border/50 bg-b-field/30">
                  <LightningIcon class="size-12 text-b-ink/20" />
                  <p class="text-center text-sm font-semibold uppercase tracking-wider text-b-ink/50">
                    No chains available.
                  </p>
                </div>
              </Show>

              <Show
                when={
                  !chainsError() &&
                  (chainsState() === "ready" ||
                    chainsState() === "refreshing") &&
                  availableChains().length > 0 &&
                  filteredChains().length === 0
                }
              >
                <div class="flex flex-col items-center justify-center gap-4 py-16 border border-dashed border-b-border/50 bg-b-field/30">
                  <SearchIcon class="size-12 text-b-ink/20" />
                  <p class="text-center text-sm font-semibold uppercase tracking-wider text-b-ink/50">
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
              <section class="border border-b-border bg-b-field overflow-hidden">
                <div class="border-b border-b-border bg-b-paper/30 px-6 py-4">
                  <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div class="flex items-center gap-3">
                      <div class="flex size-10 items-center justify-center border border-b-accent/30 bg-b-accent/10">
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
                    <button
                      type="button"
                      onClick={openCreateKeyModal}
                      disabled={
                        environmentsState() === "pending" ||
                        createKeyLoading() ||
                        deleteKeyLoading()
                      }
                      class="btn btn-md btn-interactive btn-disabled btn-primary shrink-0"
                    >
                      Create Key
                    </button>
                  </div>
                </div>

                <div class="p-6">
                  {/* Loading State */}
                  <Show when={apiKeysState() === "pending"}>
                    <div class="flex items-center justify-center gap-3 py-8 text-xs font-bold uppercase tracking-widest text-b-ink/80">
                      <LoadingSpinner class="size-4" />
                      Loading keys…
                    </div>
                  </Show>

                  <Show when={apiKeysState() === "refreshing"}>
                    <div class="mb-4 flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-b-ink/80">
                      <LoadingSpinner class="size-4" />
                      Updating keys…
                    </div>
                  </Show>

                  {/* Error State */}
                  <Show when={apiKeysError()}>
                    <p class="border-4 border-red-500/50 bg-red-500/10 px-3 py-3 text-xs font-bold uppercase leading-snug text-red-400">
                      {apiKeysError()!.message}
                    </p>
                  </Show>

                  {/* Keys List */}
                  <Show
                    when={
                      !apiKeysError() &&
                      (apiKeysState() === "ready" ||
                        apiKeysState() === "refreshing") &&
                      apiKeys().length > 0
                    }
                  >
                    <div class="mb-6">
                      <p class="mb-3 text-xs font-bold uppercase tracking-widest text-b-ink/50">
                        Active Keys
                      </p>
                      <ul class="flex flex-col gap-3">
                        <For each={apiKeys()}>
                          {(k) => (
                            <li class="flex flex-col gap-3 border border-b-border bg-b-paper p-4 sm:flex-row sm:items-center sm:justify-between transition-colors hover:border-b-border-hover">
                              <div class="min-w-0 flex-1">
                                <div class="flex items-center gap-2">
                                  <span class="inline-flex items-center border border-b-accent/20 bg-b-accent/10 px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-b-accent">
                                    {k.environment}
                                  </span>
                                </div>
                                <div class="mt-2 flex items-center gap-2">
                                  <code class="break-all font-mono text-xs font-semibold text-b-ink/80">
                                    {k.key}
                                  </code>
                                  <button
                                    type="button"
                                    onClick={() => copyToClipboard(k.key)}
                                    class="shrink-0 text-b-ink/30 hover:text-b-accent transition-colors"
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
                                disabled={
                                  createKeyLoading() || deleteKeyLoading()
                                }
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
                  <Show
                    when={
                      !apiKeysError() &&
                      (apiKeysState() === "ready" ||
                        apiKeysState() === "refreshing") &&
                      apiKeys().length === 0
                    }
                  >
                    <div class="flex flex-col items-center justify-center gap-3 py-8 border border-dashed border-b-border/50 bg-b-paper/20">
                      <EmptyStateIcon class="size-10 text-b-ink/20" />
                      <p class="text-sm font-semibold uppercase tracking-wider text-b-ink/50">
                        No API keys yet.
                      </p>
                    </div>
                  </Show>
                </div>
              </section>
            </div>
          </Show>

          {/* General Settings Tab */}
          <Show when={activeTab() === "general"}>
            <div class="flex flex-col gap-6">
              {/* Rename Section */}
              <section class="border border-b-border bg-b-field overflow-hidden">
                <div class="border-b border-b-border bg-b-paper/30 px-6 py-4">
                  <div class="flex items-center gap-3">
                    <div class="flex size-10 items-center justify-center border border-b-ink/20 bg-b-ink/5">
                      <PencilIcon class="size-5 text-b-ink/70" />
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
                    <div class="flex flex-col gap-2">
                      <label
                        for="rename-app-name"
                        class="mb-2 block text-xs font-bold uppercase tracking-widest text-b-ink/70"
                      >
                        Application Name
                      </label>
                      <div class="flex flex-col gap-2 sm:flex-row sm:items-start">
                        <div class="flex-1">
                          <input
                            id="rename-app-name"
                            type="text"
                            required
                            pattern={applicationNamePattern}
                            value={renameName() || application()?.name || ""}
                            onInput={(e) =>
                              setRenameName(e.currentTarget.value)
                            }
                            class="h-11 w-full border border-b-border bg-b-paper px-4 text-sm font-semibold text-b-ink placeholder:text-b-ink/25 outline-none focus-visible:border-b-accent/50 focus-visible:ring-2 focus-visible:ring-b-accent/20 hover:border-b-border-hover transition-all duration-200"
                            placeholder="MY APPLICATION"
                            title={applicationNameHint}
                            autocomplete="off"
                          />
                          <p class="mt-2 text-xs font-semibold uppercase tracking-wider text-b-ink/40">
                            {applicationNameHint}
                          </p>
                        </div>
                        <button
                          type="submit"
                          disabled={renameLoading()}
                          class="btn btn-md btn-interactive btn-disabled btn-primary h-11"
                        >
                          <Show when={renameLoading()}>
                            <LoadingSpinner class="size-3.5 text-b-paper" />
                          </Show>
                          {renameLoading() ? "Saving…" : "Rename"}
                        </button>
                      </div>
                    </div>

                    <Show when={renameError()}>
                      <p class="border border-red-500/40 bg-red-500/10 px-3 py-3 text-xs font-bold uppercase leading-snug text-red-400">
                        {renameError()}
                      </p>
                    </Show>
                  </form>
                </div>
              </section>

              {/* Delete Section */}
              <section class="border border-red-500/30 bg-b-field overflow-hidden">
                <div class="border-b border-red-500/30 bg-red-500/5 px-6 py-4">
                  <div class="flex items-center gap-3">
                    <div class="flex size-10 items-center justify-center border border-red-500/30 bg-red-500/10">
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
                  <p class="mb-4 text-sm text-b-ink/70">
                    Once deleted, this application and all its associated data
                    will be permanently removed. This action cannot be undone.
                  </p>

                  <Show when={deleteError()}>
                    <p class="mb-4 border border-red-500/40 bg-red-500/10 px-3 py-3 text-xs font-bold uppercase leading-snug text-red-400">
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

          {/* Providers Tab */}
          <Show when={activeTab() === "providers"}>
            <div class="flex flex-col gap-6">
              <section class="border border-b-border bg-b-field overflow-hidden">
                <div class="border-b border-b-border bg-b-paper/30 px-6 py-4">
                  <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div class="flex items-center gap-3">
                      <div class="flex size-10 items-center justify-center border border-b-accent/30 bg-b-accent/10">
                        <ProviderIcon class="size-5 text-b-accent" />
                      </div>
                      <div>
                        <h2 class="font-['Anton',sans-serif] text-xl uppercase tracking-wide text-b-ink">
                          Global Providers
                        </h2>
                        <p class="text-xs font-bold uppercase tracking-widest text-b-ink/50">
                          Available RPC providers across all applications
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={openProviderModal}
                      disabled={
                        providersState() === "pending" ||
                        createProviderLoading() ||
                        deleteProviderLoading()
                      }
                      class="btn btn-md btn-interactive btn-disabled btn-primary shrink-0"
                    >
                      New provider
                    </button>
                  </div>
                </div>

                <div class="p-6">
                  {/* Loading State */}
                  <Show when={providersState() === "pending"}>
                    <div class="flex items-center justify-center gap-3 py-8 text-xs font-bold uppercase tracking-widest text-b-ink/80">
                      <LoadingSpinner class="size-4" />
                      Loading providers…
                    </div>
                  </Show>

                  <Show when={providersState() === "refreshing"}>
                    <div class="mb-4 flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-b-ink/80">
                      <LoadingSpinner class="size-4" />
                      Updating providers…
                    </div>
                  </Show>

                  {/* Error State */}
                  <Show when={providersError()}>
                    <p class="border border-red-500/40 bg-red-500/10 px-3 py-3 text-xs font-bold uppercase leading-snug text-red-400">
                      {providersError()!.message}
                    </p>
                  </Show>

                  {/* Providers List */}
                  <Show
                    when={
                      !providersError() &&
                      (providersState() === "ready" ||
                        providersState() === "refreshing") &&
                      providers().length > 0
                    }
                  >
                    <div class="flex flex-col gap-3">
                      <For each={providers()}>
                        {(provider) => (
                          <div class="flex flex-col gap-3 border border-b-border bg-b-paper p-4 sm:flex-row sm:items-center sm:justify-between transition-colors hover:border-b-border-hover">
                            <div class="min-w-0 flex-1">
                              <div class="flex items-center gap-2">
                                <span class="font-['Anton',sans-serif] text-lg uppercase tracking-wide text-b-ink">
                                  {provider.name}
                                </span>
                              </div>
                              <div class="mt-2 flex items-center gap-4 text-xs font-semibold uppercase tracking-wider text-b-ink/50">
                                <span class="inline-flex items-center gap-1">
                                  <LightningIcon class="size-3.5" />
                                  {provider.rateLimit} req/s
                                </span>
                                <span class="inline-flex items-center gap-1">
                                  <RpcIcon class="size-3.5" />
                                  {provider.rpcCount} RPCs
                                </span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setDeleteProviderError(null);
                                setProviderToDelete(provider);
                              }}
                              disabled={
                                createProviderLoading() || deleteProviderLoading()
                              }
                              class="btn btn-sm btn-interactive btn-disabled btn-danger shrink-0"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </For>
                    </div>
                  </Show>

                  {/* No Providers State */}
                  <Show
                    when={
                      !providersError() &&
                      (providersState() === "ready" ||
                        providersState() === "refreshing") &&
                      providers().length === 0
                    }
                  >
                    <div class="flex flex-col items-center justify-center gap-3 py-8 border border-dashed border-b-border/50 bg-b-paper/20">
                      <EmptyStateIcon class="size-10 text-b-ink/20" />
                      <p class="text-sm font-semibold uppercase tracking-wider text-b-ink/50">
                        No providers available.
                      </p>
                    </div>
                  </Show>
                </div>
              </section>
            </div>
          </Show>
        </div>
      </div>

      {/* Delete Application Confirmation Modal */}
      <Show when={deleteLoading() && activeTab() === "general"}>
        <div
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4 py-8"
          role="presentation"
          onClick={() => setDeleteLoading(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-application-title"
            class="w-full max-w-md border border-red-500/30 bg-b-field p-8 shadow-[0_25px_50px_rgba(0,0,0,0.5)]"
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
            <p class="mb-8 text-sm font-semibold text-b-ink/70">
              Permanently delete{" "}
              <span class="font-bold text-red-400">{application()?.name}</span>?
              This cannot be undone.
            </p>

            <Show when={deleteError()}>
              <p class="mb-6 border border-red-500/40 bg-red-500/10 px-3 py-3 text-xs font-bold uppercase leading-snug text-red-400">
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

      <Show when={providerModalOpen()}>
        <div
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4 py-8"
          role="presentation"
          onClick={closeProviderModal}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-provider-title"
            class="w-full max-w-md border border-b-border bg-b-field p-8 shadow-[0_25px_50px_rgba(0,0,0,0.5)]"
            onClick={(e) => e.stopPropagation()}
          >
            <p class="mb-2 text-xs font-bold uppercase tracking-[0.35em] text-b-accent">
              Create
            </p>
            <h3
              id="new-provider-title"
              class="mb-8 font-['Anton',sans-serif] text-4xl uppercase leading-none tracking-wide text-b-ink"
            >
              New provider
            </h3>

            <form onSubmit={handleCreateProvider} class="flex flex-col gap-6">
              <div class="flex flex-col gap-2">
                <label
                  for="new-provider-name"
                  class="text-xs font-bold uppercase tracking-widest text-b-ink/70"
                >
                  Name
                </label>
                <input
                  id="new-provider-name"
                  type="text"
                  required
                  pattern={applicationNamePattern}
                  value={newProviderName()}
                  onInput={(e) => setNewProviderName(e.currentTarget.value)}
                  class="h-11 w-full border border-b-border bg-b-paper px-4 text-sm font-semibold text-b-ink placeholder:text-b-ink/25 outline-none focus-visible:border-b-accent/50 focus-visible:ring-2 focus-visible:ring-b-accent/20 hover:border-b-border-hover transition-all duration-200"
                  placeholder="MY_PROVIDER"
                  title={applicationNameHint}
                  autocomplete="off"
                />
                <p class="text-xs font-semibold uppercase tracking-wider text-b-ink/40">
                  {applicationNameHint}
                </p>
              </div>

              <div class="flex flex-col gap-2">
                <label
                  for="new-provider-rate-limit"
                  class="text-xs font-bold uppercase tracking-widest text-b-ink/70"
                >
                  Rate limit (req/s)
                </label>
                <input
                  id="new-provider-rate-limit"
                  type="number"
                  required
                  min={1}
                  step={1}
                  value={newProviderRateLimit()}
                  onInput={(e) =>
                    setNewProviderRateLimit(e.currentTarget.value)
                  }
                  class="h-11 w-full border border-b-border bg-b-paper px-4 text-sm font-semibold text-b-ink outline-none focus-visible:border-b-accent/50 focus-visible:ring-2 focus-visible:ring-b-accent/20 hover:border-b-border-hover transition-all duration-200"
                />
              </div>

              <Show when={createProviderError()}>
                <p class="border border-red-500/40 bg-red-500/10 px-3 py-3 text-xs font-bold uppercase leading-snug text-red-400">
                  {createProviderError()}
                </p>
              </Show>

              <div class="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeProviderModal}
                  disabled={createProviderLoading()}
                  class="btn btn-md btn-interactive btn-disabled btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createProviderLoading()}
                  class="btn btn-md btn-interactive btn-disabled btn-primary"
                >
                  <Show when={createProviderLoading()}>
                    <LoadingSpinner class="size-3.5 text-b-paper" />
                  </Show>
                  {createProviderLoading() ? "Creating…" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Show>

      <Show when={providerToDelete()}>
        <div
          class="fixed inset-0 z-[55] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4 py-8"
          role="presentation"
          onClick={() =>
            !deleteProviderLoading() && setProviderToDelete(null)
          }
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-provider-title"
            class="w-full max-w-md border border-red-500/30 bg-b-field p-8 shadow-[0_25px_50px_rgba(0,0,0,0.5)]"
            onClick={(e) => e.stopPropagation()}
          >
            <p class="mb-2 text-xs font-bold uppercase tracking-[0.35em] text-red-400">
              Confirm Deletion
            </p>
            <h3
              id="delete-provider-title"
              class="mb-4 font-['Anton',sans-serif] text-4xl uppercase leading-none tracking-wide text-b-ink"
            >
              Delete provider
            </h3>
            <p class="mb-8 text-sm font-semibold text-b-ink/70">
              Permanently delete{" "}
              <span class="font-bold text-red-400">
                {providerToDelete()!.name}
              </span>
              ? This cannot be undone.
            </p>

            <Show when={deleteProviderError()}>
              <p class="mb-6 border border-red-500/40 bg-red-500/10 px-3 py-3 text-xs font-bold uppercase leading-snug text-red-400">
                {deleteProviderError()}
              </p>
            </Show>

            <div class="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setProviderToDelete(null)}
                disabled={deleteProviderLoading()}
                class="btn btn-md btn-interactive btn-disabled btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteRpcProvider}
                disabled={deleteProviderLoading()}
                class="btn btn-md btn-interactive btn-disabled btn-danger"
              >
                <Show when={deleteProviderLoading()}>
                  <LoadingSpinner class="size-3.5" />
                </Show>
                {deleteProviderLoading() ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      </Show>

      {/* Create Key Modal */}
      <Show when={createKeyModalOpen()}>
        <div
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4 py-8"
          role="presentation"
          onClick={closeCreateKeyModal}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-key-title"
            class="w-full max-w-md border border-b-border bg-b-field p-8 shadow-[0_25px_50px_rgba(0,0,0,0.5)]"
            onClick={(e) => e.stopPropagation()}
          >
            <p class="mb-2 text-xs font-bold uppercase tracking-[0.35em] text-b-accent">
              Create
            </p>
            <h3
              id="create-key-title"
              class="mb-8 font-['Anton',sans-serif] text-4xl uppercase leading-none tracking-wide text-b-ink"
            >
              New API Key
            </h3>

            <form onSubmit={handleCreateKey} class="flex flex-col gap-6">
              <div class="flex flex-col gap-2">
                <label
                  for="new-key-environment"
                  class="text-xs font-bold uppercase tracking-widest text-b-ink/70"
                >
                  Environment
                </label>
                <Show when={environmentsState() === "pending"}>
                  <div class="flex h-11 items-center gap-2 border border-b-border bg-b-field px-3">
                    <LoadingSpinner class="size-4" />
                    <span class="text-xs font-bold uppercase tracking-widest text-b-ink/50">
                      Loading…
                    </span>
                  </div>
                </Show>
                <Show when={environmentsError()}>
                  <p class="border border-red-500/40 bg-red-500/10 px-3 py-3 text-xs font-bold uppercase leading-snug text-red-400">
                    {environmentsError()!.message}
                  </p>
                </Show>
                <Show
                  when={
                    environmentsState() === "ready" && newKeyEnvironment()
                  }
                >
                  <select
                    id="new-key-environment"
                    value={newKeyEnvironment()}
                    onChange={(e) =>
                      setNewKeyEnvironment(
                        e.currentTarget.value || undefined,
                      )
                    }
                    class="h-11 w-full appearance-none border border-b-border bg-b-field px-4 pr-10 text-sm font-bold uppercase tracking-widest text-b-ink outline-none focus-visible:border-b-accent/50 focus-visible:ring-2 focus-visible:ring-b-accent/20 hover:border-b-border-hover transition-all duration-200 cursor-pointer"
                  >
                    <For each={environments()}>
                      {(env) => (
                        <option value={env} class="bg-b-field">
                          {env}
                        </option>
                      )}
                    </For>
                  </select>
                </Show>
              </div>

              <Show when={createKeyError()}>
                <p class="border border-red-500/40 bg-red-500/10 px-3 py-3 text-xs font-bold uppercase leading-snug text-red-400">
                  {createKeyError()}
                </p>
              </Show>

              <div class="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeCreateKeyModal}
                  disabled={createKeyLoading()}
                  class="btn btn-md btn-interactive btn-disabled btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createKeyLoading() || !newKeyEnvironment()}
                  class="btn btn-md btn-interactive btn-disabled btn-primary"
                >
                  <Show when={createKeyLoading()}>
                    <LoadingSpinner class="size-3.5 text-b-paper" />
                  </Show>
                  {createKeyLoading() ? "Creating…" : "Create Key"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Show>

      {/* Revoke Key Confirmation Modal */}
      <Show when={apiKeyToDelete()}>
        <div
          class="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4 py-8"
          role="presentation"
          onClick={() => setApiKeyToDelete(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-api-key-title"
            class="w-full max-w-md border border-red-500/30 bg-b-field p-8 shadow-[0_25px_50px_rgba(0,0,0,0.5)]"
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
            <p class="mb-4 text-sm font-semibold text-b-ink/70">
              Permanently revoke this key for{" "}
              <span class="font-bold text-red-400">
                {apiKeyToDelete()!.environment}
              </span>
              ?
            </p>
            <p class="mb-8 text-xs text-b-ink/40">
              Clients using this key will stop working immediately.
            </p>

            <Show when={deleteKeyError()}>
              <p class="mb-6 border border-red-500/40 bg-red-500/10 px-3 py-3 text-xs font-bold uppercase leading-snug text-red-400">
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
