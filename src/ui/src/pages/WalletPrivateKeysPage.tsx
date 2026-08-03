import { useParams, useSearchParams } from "@solidjs/router";
import {
  createEffect,
  createMemo,
  createSignal,
  For,
  Show,
} from "solid-js";
import LoadingSpinner from "../components/LoadingSpinner";
import Modal from "../components/Modal";
import SegmentedControl from "../components/SegmentedControl";
import ApiKeyModal from "../components/ApiKeyModal";
import PrivateKeyModal from "../components/PrivateKeyModal";
import CheckmarkIcon from "../components/icons/CheckmarkIcon";
import CopyIcon from "../components/icons/CopyIcon";
import EmptyStateIcon from "../components/icons/EmptyStateIcon";
import EyeIcon from "../components/icons/EyeIcon";
import KeyIcon from "../components/icons/KeyIcon";
import PencilIcon from "../components/icons/PencilIcon";
import PlusIcon from "../components/icons/PlusIcon";
import TrashIcon from "../components/icons/TrashIcon";
import { useAuth } from "../lib/auth";
import {
  createNamedDerivationPath,
  derivationPathHint,
  derivationPathPattern,
  formatDerivationPath,
  getNamedDerivationPath,
  isValidDerivationPath,
  matchNamedDerivationPath,
  MAX_DERIVATION_INDEX,
  NAMED_DERIVATION_PATHS,
  validateDerivationIndex,
  type AddressFormat,
  type DerivationCurve,
  type NamedDerivationPath,
} from "../lib/derivation-paths";
import { readErrorMessage } from "../lib/error-groups";
import { formatLastUsed, truncateMiddle } from "../lib/format";
import {
  nameValidationHint,
  nameValidationPattern,
  validateName,
} from "../lib/name-validation";
import { useReferenceData } from "../lib/reference-data";
import {
  useWalletData,
  type WalletApiKeySummary,
  type WalletPrivateKeySummary,
} from "../lib/wallet-data";

function curveBadgeClass(curve: string): string {
  switch (curve) {
    case "Secp256k1":
      return "text-orange-300 border-orange-500/30 bg-orange-500/10";
    case "Ed25519":
      return "text-sky-300 border-sky-500/30 bg-sky-500/10";
    default:
      return "text-b-ink/50 border-b-border bg-b-paper/30";
  }
}

const namedPathBadgeClass: Record<string, string> = {
  evm: "text-violet-300 border-violet-500/30 bg-violet-500/10",
  solana: "text-green-300 border-green-500/30 bg-green-500/10",
  cosmos: "text-amber-300 border-amber-500/30 bg-amber-500/10",
};

const namedPathHeaderClass: Record<string, string> = {
  evm: "text-violet-300",
  solana: "text-green-300",
  cosmos: "text-amber-300",
};

function NamedPathBadge(props: {
  namedPath: NamedDerivationPath;
  index: number;
  class?: string;
}) {
  return (
    <span
      class={`inline-flex items-center border font-bold uppercase tracking-widest ${namedPathBadgeClass[props.namedPath.id] ?? "text-b-ink/50 border-b-border bg-b-paper/30"} ${props.class ?? "h-4 px-1.5 text-[0.55rem] leading-none"}`}
    >
      {props.namedPath.label} #{props.index}
    </span>
  );
}

type SidebarGroup = {
  id: string;
  label: string;
  headerClass: string;
  keys: WalletPrivateKeySummary[];
};

function CopyAddressButton(props: { address: string }) {
  const [copied, setCopied] = createSignal(false);
  let timer: ReturnType<typeof setTimeout> | undefined;

  const handleCopy = () => {
    void navigator.clipboard.writeText(props.address);
    if (timer !== undefined) {
      clearTimeout(timer);
    }
    setCopied(true);
    timer = setTimeout(() => {
      setCopied(false);
      timer = undefined;
    }, 2000);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      class="inline-flex size-6 shrink-0 items-center justify-center rounded border border-b-border bg-b-field text-b-ink transition-all duration-200 hover:border-b-border-hover hover:bg-b-stripe focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-b-accent"
      title={copied() ? "Copied" : "Copy address"}
    >
      {copied() ? (
        <CheckmarkIcon class="size-3 text-b-accent" />
      ) : (
        <CopyIcon class="size-3 opacity-70" />
      )}
    </button>
  );
}

export default function WalletPrivateKeysPage() {
  const auth = useAuth();
  const referenceData = useReferenceData();
  const walletData = useWalletData();
  const params = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const walletId = () => params.walletId;

  const privateKeys = walletData.privateKeys.data;
  const privateKeysState = walletData.privateKeys.state;
  const privateKeysError = walletData.privateKeys.error;

  const wallet = createMemo(
    () =>
      referenceData.wallets.data().find((w) => w.id === walletId()) ?? null,
  );

  const requestedPrivateKeyId = () => {
    const value = searchParams.privateKey;
    return Array.isArray(value) ? value[0] : value;
  };

  const activePrivateKeyId = createMemo(() => {
    const list = privateKeys();
    const requested = requestedPrivateKeyId();
    if (requested && list.some((pk) => pk.id === requested)) return requested;
    return list[0]?.id ?? null;
  });

  const activePrivateKey = createMemo(
    () =>
      privateKeys().find((pk) => pk.id === activePrivateKeyId()) ?? null,
  );

  const activePrivateKeyMatch = createMemo(() => {
    const key = activePrivateKey();
    return key ? matchNamedDerivationPath(key.derivationPath) : null;
  });

  const sidebarGroups = createMemo<SidebarGroup[]>(() => {
    const list = privateKeys();
    const namedPathGroups: SidebarGroup[] = NAMED_DERIVATION_PATHS.map(
      (namedPath) => ({
        id: namedPath.id,
        label: namedPath.label,
        headerClass:
          namedPathHeaderClass[namedPath.id] ?? "text-b-ink/50",
        keys: list.filter(
          (pk) =>
            matchNamedDerivationPath(pk.derivationPath)?.namedPath.id ===
            namedPath.id,
        ),
      }),
    );
    const unnamedGroups: SidebarGroup[] = [
      {
        id: "secp256k1",
        label: "Secp256k1",
        headerClass: "text-orange-300",
        keys: list.filter(
          (pk) =>
            pk.curve === "Secp256k1" &&
            matchNamedDerivationPath(pk.derivationPath) === null,
        ),
      },
      {
        id: "ed25519",
        label: "Ed25519",
        headerClass: "text-sky-300",
        keys: list.filter(
          (pk) =>
            pk.curve === "Ed25519" &&
            matchNamedDerivationPath(pk.derivationPath) === null,
        ),
      },
    ];
    return [...namedPathGroups, ...unnamedGroups].filter(
      (group) => group.keys.length > 0,
    );
  });

  createEffect(() => {
    const selected = activePrivateKeyId();
    if (requestedPrivateKeyId() !== selected) {
      setSearchParams(
        { privateKey: selected ?? undefined },
        { replace: true },
      );
    }
  });

  // Create private key modal
  const [createPkOpen, setCreatePkOpen] = createSignal(false);
  const [createMode, setCreateMode] = createSignal<string>("evm");
  const [pkIndex, setPkIndex] = createSignal("");
  const [pkCurve, setPkCurve] = createSignal<DerivationCurve>("Secp256k1");
  const [pkAddressFormat, setPkAddressFormat] =
    createSignal<AddressFormat>("Evm");
  const [pkPath, setPkPath] = createSignal("");
  const [pkError, setPkError] = createSignal<string | null>(null);
  const [pkLoading, setPkLoading] = createSignal(false);

  const createNamedPath = createMemo(
    () => getNamedDerivationPath(createMode()) ?? null,
  );

  // Create API key modal
  const [createKeyOpen, setCreateKeyOpen] = createSignal(false);
  const [newKeyName, setNewKeyName] = createSignal("");
  const [createKeyError, setCreateKeyError] = createSignal<string | null>(null);
  const [createKeyLoading, setCreateKeyLoading] = createSignal(false);
  const [apiKeyToView, setApiKeyToView] =
    createSignal<WalletApiKeySummary | null>(null);

  // Rename API key
  const [editingApiKeyId, setEditingApiKeyId] = createSignal<string | null>(
    null,
  );
  const [editingApiKeyName, setEditingApiKeyName] = createSignal("");
  const [editKeyError, setEditKeyError] = createSignal<string | null>(null);
  const [editKeyLoading, setEditKeyLoading] = createSignal(false);

  // Delete confirmations
  const [pkToView, setPkToView] = createSignal<WalletPrivateKeySummary | null>(
    null,
  );
  const [pkToDelete, setPkToDelete] = createSignal<WalletPrivateKeySummary | null>(
    null,
  );
  const [deletePkError, setDeletePkError] = createSignal<string | null>(null);
  const [deletePkLoading, setDeletePkLoading] = createSignal(false);
  const [apiKeyToDelete, setApiKeyToDelete] =
    createSignal<WalletApiKeySummary | null>(null);
  const [deleteKeyError, setDeleteKeyError] = createSignal<string | null>(null);
  const [deleteKeyLoading, setDeleteKeyLoading] = createSignal(false);

  const isBusy = () =>
    pkLoading() ||
    createKeyLoading() ||
    editKeyLoading() ||
    deletePkLoading() ||
    deleteKeyLoading();

  const openCreatePkModal = () => {
    if (isBusy()) return;
    setPkError(null);
    setCreateMode("evm");
    setPkIndex("");
    setPkCurve("Secp256k1");
    setPkAddressFormat("Evm");
    setPkPath("");
    setCreatePkOpen(true);
  };

  const closeCreatePkModal = () => {
    if (pkLoading()) return;
    setCreatePkOpen(false);
    setPkError(null);
  };

  const handleCreatePrivateKey = async (e: SubmitEvent) => {
    e.preventDefault();
    const token = auth.token;
    if (!token) return;

    let curve: DerivationCurve;
    let addressFormat: AddressFormat;
    let path: string;

    const namedPath = getNamedDerivationPath(createMode());
    if (namedPath) {
      const indexError = validateDerivationIndex(pkIndex());
      if (indexError) {
        setPkError(indexError);
        return;
      }
      const pathValue = createNamedDerivationPath(
        namedPath.id,
        Number(pkIndex().trim()),
      );
      if (pathValue === null) {
        setPkError(`Index must be between 0 and ${MAX_DERIVATION_INDEX}.`);
        return;
      }
      curve = namedPath.curve;
      addressFormat = namedPath.addressFormat;
      path = pathValue;
    } else {
      const manualPath = pkPath().trim();
      if (manualPath.length === 0) {
        setPkError("Derivation path is required.");
        return;
      }
      if (!isValidDerivationPath(manualPath)) {
        setPkError(
          "Derivation path must be a valid BIP44 path, e.g. m/44'/60'/0'/0/0.",
        );
        return;
      }
      curve = pkCurve();
      addressFormat = pkAddressFormat();
      path = manualPath;
    }

    setPkError(null);
    setPkLoading(true);
    try {
      const response = await fetch(
        `/api/Wallets/${walletId()}/PrivateKeys`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            curve,
            addressFormat,
            derivationPath: path,
          }),
        },
      );
      if (!response.ok) {
        throw new Error(
          await readErrorMessage(response, "Failed to create private key"),
        );
      }
      const created = (await response.json()) as {
        id: string;
        curve: string;
        derivationPath: string;
        addressFormat: AddressFormat;
        address: string;
        publicKey: string;
      };
      walletData.addPrivateKey({
        ...created,
        apiKeys: [],
      });
      setSearchParams({ privateKey: created.id });
      setCreatePkOpen(false);
      void walletData.refresh();
      void referenceData.refreshWallets();
    } catch (err) {
      setPkError(
        err instanceof Error ? err.message : "Failed to create private key",
      );
    } finally {
      setPkLoading(false);
    }
  };

  const openCreateKeyModal = () => {
    if (isBusy()) return;
    setCreateKeyError(null);
    setNewKeyName("");
    setCreateKeyOpen(true);
  };

  const closeCreateKeyModal = () => {
    if (createKeyLoading()) return;
    setCreateKeyOpen(false);
    setCreateKeyError(null);
    setNewKeyName("");
  };

  const handleCreateApiKey = async (e: SubmitEvent) => {
    e.preventDefault();
    const token = auth.token;
    const pkId = activePrivateKeyId();
    if (!token || !pkId) return;

    const name = newKeyName();
    const validationError = validateName(name);
    if (validationError) {
      setCreateKeyError(validationError);
      return;
    }

    setCreateKeyError(null);
    setCreateKeyLoading(true);
    try {
      const response = await fetch(
        `/api/Wallets/${walletId()}/PrivateKeys/${pkId}/ApiKeys`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ name }),
        },
      );
      if (!response.ok) {
        throw new Error(
          await readErrorMessage(response, "Failed to create API key"),
        );
      }
      const created = (await response.json()) as {
        id: string;
        name: string;
        lastUsedAt: string | null;
      };
      walletData.addApiKey(pkId, {
        id: created.id,
        name: created.name,
        lastUsedAt: created.lastUsedAt ?? undefined,
      });
      void walletData.refresh();
      setCreateKeyOpen(false);
      setNewKeyName("");
    } catch (err) {
      setCreateKeyError(
        err instanceof Error ? err.message : "Failed to create API key",
      );
    } finally {
      setCreateKeyLoading(false);
    }
  };

  const startEditingApiKey = (apiKey: WalletApiKeySummary) => {
    if (isBusy()) return;
    setEditKeyError(null);
    setEditingApiKeyId(apiKey.id);
    setEditingApiKeyName(apiKey.name);
  };

  const cancelEditingApiKey = () => {
    if (editKeyLoading()) return;
    setEditingApiKeyId(null);
    setEditingApiKeyName("");
    setEditKeyError(null);
  };

  const handleRenameApiKey = async (apiKey: WalletApiKeySummary) => {
    const token = auth.token;
    const pkId = activePrivateKeyId();
    if (!token || !pkId) return;

    const name = editingApiKeyName();
    const validationError = validateName(name);
    if (validationError) {
      setEditKeyError(validationError);
      return;
    }

    if (apiKey.name === name) {
      cancelEditingApiKey();
      return;
    }

    setEditKeyError(null);
    setEditKeyLoading(true);
    try {
      const response = await fetch(
        `/api/Wallets/${walletId()}/PrivateKeys/${pkId}/ApiKeys/${apiKey.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ name }),
        },
      );
      if (!response.ok) {
        throw new Error(
          await readErrorMessage(response, "Failed to rename API key"),
        );
      }
      walletData.renameApiKey(pkId, apiKey.id, name);
      setEditingApiKeyId(null);
      setEditingApiKeyName("");
      void walletData.refresh();
    } catch (err) {
      setEditKeyError(
        err instanceof Error ? err.message : "Failed to rename API key",
      );
    } finally {
      setEditKeyLoading(false);
    }
  };

  const handleDeleteApiKey = async () => {
    const token = auth.token;
    const pkId = activePrivateKeyId();
    const apiKey = apiKeyToDelete();
    if (!token || !pkId || !apiKey) return;

    setDeleteKeyError(null);
    setDeleteKeyLoading(true);
    try {
      const response = await fetch(
        `/api/Wallets/${walletId()}/PrivateKeys/${pkId}/ApiKeys/${apiKey.id}`,
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
      walletData.removeApiKey(pkId, apiKey.id);
      setApiKeyToDelete(null);
      void walletData.refresh();
    } catch (err) {
      setDeleteKeyError(
        err instanceof Error ? err.message : "Failed to delete API key",
      );
    } finally {
      setDeleteKeyLoading(false);
    }
  };

  const handleDeletePrivateKey = async () => {
    const token = auth.token;
    const pk = pkToDelete();
    if (!token || !pk) return;

    setDeletePkError(null);
    setDeletePkLoading(true);
    try {
      const response = await fetch(
        `/api/Wallets/${walletId()}/PrivateKeys/${pk.id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!response.ok) {
        throw new Error(
          await readErrorMessage(response, "Failed to delete private key"),
        );
      }
      walletData.removePrivateKey(pk.id);
      setPkToDelete(null);
      await walletData.refresh();
      void referenceData.refreshWallets();
    } catch (err) {
      setDeletePkError(
        err instanceof Error ? err.message : "Failed to delete private key",
      );
    } finally {
      setDeletePkLoading(false);
    }
  };

  return (
    <>
      <div class="flex min-h-0 flex-1 flex-col gap-6">
        <section class="flex min-h-0 flex-1 flex-col border border-b-border bg-b-field overflow-hidden">
          <div class="border-b border-b-border bg-b-paper/30 px-6 py-4">
            <div class="flex items-center gap-3">
              <div class="flex size-10 items-center justify-center border border-b-accent/30 bg-b-accent/10">
                <KeyIcon class="size-5 text-b-accent" />
              </div>
              <div>
                <h2 class="font-['Anton',sans-serif] text-xl uppercase tracking-wide text-b-ink">
                  Private Keys
                </h2>
                <p class="text-xs font-bold uppercase tracking-widest text-b-ink/50">
                  {wallet()
                    ? `Derived keys and API keys for ${wallet()!.name}`
                    : "Derived keys and API keys"}
                </p>
              </div>
            </div>
          </div>

          <div class="flex flex-col gap-3 flex-1 min-h-0 overflow-hidden">
            <Show
              when={
                privateKeysState() === "pending" ||
                privateKeysState() === "idle"
              }
            >
              <div class="flex flex-col items-center justify-center gap-4 py-16">
                <LoadingSpinner class="size-8" />
                <p class="text-sm font-bold uppercase tracking-widest text-b-ink/80">
                  Loading private keys…
                </p>
              </div>
            </Show>

            <Show when={privateKeysState() === "refreshing"}>
              <div class="flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-b-ink/80">
                <LoadingSpinner class="size-4" />
                Updating…
              </div>
            </Show>

            <Show when={privateKeysError()}>
              <div class="mx-auto max-w-md">
                <p class="border-4 border-red-500/50 bg-red-500/10 px-4 py-4 text-center text-xs font-bold uppercase leading-snug text-red-400">
                  {privateKeysError()!.message}
                </p>
              </div>
            </Show>

            <Show
              when={
                !privateKeysError() &&
                (privateKeysState() === "ready" ||
                  privateKeysState() === "refreshing")
              }
            >
              <div class="flex flex-col gap-4 lg:flex-row lg:items-stretch lg:gap-6 flex-1 min-h-0 overflow-hidden">
                {/* Sidebar: derivation paths */}
                <aside class="flex max-h-[min(22rem,52vh)] min-h-0 flex-col overflow-hidden border border-b-border bg-b-field lg:max-h-none lg:w-72 lg:shrink-0">
                  <div class="shrink-0 space-y-3 border-b border-b-border p-4">
                    <button
                      type="button"
                      onClick={openCreatePkModal}
                      disabled={isBusy()}
                      class="flex w-full items-center justify-center gap-2 border border-dashed border-b-border/50 bg-b-paper/10 px-3 py-2.5 text-left transition-all duration-150 hover:border-b-accent/50 hover:bg-b-accent/5 disabled:opacity-40"
                    >
                      <PlusIcon class="size-4 text-b-accent" />
                      <span class="text-xs font-bold uppercase tracking-wider text-b-accent">
                        Add Private Key
                      </span>
                    </button>
                  </div>

                  <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2 [scrollbar-gutter:stable]">
                    <For each={sidebarGroups()}>
                      {(group) => (
                        <div class="mb-1">
                          <div class="flex items-center justify-between px-3 pb-1.5 pt-2.5 first:pt-1">
                            <p
                              class={`text-xs font-bold uppercase tracking-[0.3em] ${group.headerClass}`}
                            >
                              {group.label}
                            </p>
                            <span class="tabular-nums text-[0.65rem] font-bold uppercase tracking-widest text-b-ink/45">
                              {group.keys.length}
                            </span>
                          </div>
                          <For each={group.keys}>
                            {(pk) => {
                              const isActive = () => activePrivateKeyId() === pk.id;
                              const match = matchNamedDerivationPath(
                                pk.derivationPath,
                              );
                              return (
                                <div
                                  role="button"
                                  tabindex="0"
                                  onClick={() =>
                                    setSearchParams({ privateKey: pk.id })
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                      e.preventDefault();
                                      setSearchParams({ privateKey: pk.id });
                                    }
                                  }}
                                  class={`group mb-1 flex w-full cursor-pointer items-center justify-between gap-2 border px-3 py-2.5 text-left transition-all duration-150 last:mb-0 ${
                                    isActive()
                                      ? "border-b-accent bg-b-accent/10 text-b-ink shadow-[inset_2px_0_0_0_var(--color-b-accent)]"
                                      : "border-transparent bg-b-paper/15 text-b-ink/85 hover:border-b-border-hover hover:bg-b-paper/35"
                                  }`}
                                >
                                  <div class="flex min-w-0 flex-col gap-1">
                                    <div class="flex min-w-0 items-center">
                                      <Show
                                        when={match === null}
                                        fallback={
                                          <NamedPathBadge
                                            namedPath={match!.namedPath}
                                            index={match!.index}
                                          />
                                        }
                                      >
                                        <p
                                          class="truncate font-mono text-xs font-semibold text-b-ink/80"
                                          title={pk.derivationPath}
                                        >
                                          {pk.derivationPath}
                                        </p>
                                      </Show>
                                    </div>
                                    <p
                                      class="truncate font-mono text-[0.65rem] font-semibold text-b-ink/50"
                                      title={pk.address}
                                    >
                                      {truncateMiddle(pk.address)}
                                    </p>
                                  </div>
                                  <div class="flex shrink-0 items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setPkToView(pk);
                                      }}
                                      disabled={isBusy()}
                                      class="opacity-0 transition-opacity duration-150 hover:text-b-accent group-hover:opacity-100 focus:opacity-100 disabled:opacity-30"
                                      title="View private key"
                                    >
                                      <EyeIcon class="size-4" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setDeletePkError(null);
                                        setPkToDelete(pk);
                                      }}
                                      disabled={isBusy()}
                                      class="opacity-0 transition-opacity duration-150 hover:text-red-400 group-hover:opacity-100 focus:opacity-100 disabled:opacity-30"
                                      title="Delete private key"
                                    >
                                      <TrashIcon class="size-4" />
                                    </button>
                                  </div>
                                </div>
                              );
                            }}
                          </For>
                        </div>
                      )}
                    </For>
                  </div>
                </aside>

                {/* Main panel: API keys */}
                <section class="flex min-h-[min(24rem,55vh)] min-w-0 flex-1 flex-col overflow-hidden border border-b-border bg-b-field lg:min-h-0">
                  <Show
                    when={activePrivateKey()}
                    fallback={
                      <div class="flex flex-1 flex-col items-center justify-center gap-3 p-10">
                        <EmptyStateIcon class="size-10 text-b-ink/20" />
                        <p class="text-center text-sm font-semibold uppercase tracking-wider text-b-ink/50">
                          No private keys yet. Add one to derive keys and
                          manage API keys.
                        </p>
                        <button
                          type="button"
                          onClick={openCreatePkModal}
                          disabled={isBusy()}
                          class="btn btn-md btn-interactive btn-disabled btn-primary"
                        >
                          <PlusIcon class="size-4" />
                          Add Private Key
                        </button>
                      </div>
                    }
                  >
                    <div class="flex min-h-0 flex-1 flex-col">
                      <div class="flex shrink-0 flex-col gap-3 border-b border-b-border p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div class="min-w-0">
                          <div class="flex min-w-0 items-center gap-2">
                            <Show
                              when={activePrivateKeyMatch()}
                              fallback={
                                <span
                                  class={`inline-flex shrink-0 items-center border px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-widest ${curveBadgeClass(activePrivateKey()!.curve)}`}
                                >
                                  {activePrivateKey()!.curve}
                                </span>
                              }
                            >
                              <NamedPathBadge
                                namedPath={activePrivateKeyMatch()!.namedPath}
                                index={activePrivateKeyMatch()!.index}
                                class="px-2 py-0.5 text-[0.6rem]"
                              />
                            </Show>
                            <code
                              class="truncate font-mono text-sm font-semibold text-b-ink"
                              title={activePrivateKey()!.address}
                            >
                              {activePrivateKey()!.address}
                            </code>
                            <CopyAddressButton
                              address={activePrivateKey()!.address}
                            />
                          </div>
                        </div>
                        <div class="flex shrink-0 flex-col self-start sm:self-center">
                          <button
                            type="button"
                            onClick={openCreateKeyModal}
                            disabled={isBusy()}
                            class="btn btn-sm btn-interactive btn-disabled btn-primary shrink-0"
                          >
                            <PlusIcon class="size-4" />
                            Create API Key
                          </button>
                        </div>
                      </div>

                      <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
                        <Show
                          when={activePrivateKey()!.apiKeys.length > 0}
                          fallback={
                            <div class="flex flex-col items-center justify-center gap-3 py-12 border border-dashed border-b-border/50 bg-b-paper/20">
                              <KeyIcon class="size-6 text-b-ink/30" />
                              <p class="text-sm font-semibold uppercase tracking-wider text-b-ink/50">
                                No API keys yet
                              </p>
                              <button
                                type="button"
                                onClick={openCreateKeyModal}
                                disabled={isBusy()}
                                class="btn btn-sm btn-interactive btn-disabled btn-primary"
                              >
                                Create API Key
                              </button>
                            </div>
                          }
                        >
                          <ul class="flex flex-col gap-4">
                            <For each={activePrivateKey()!.apiKeys}>
                              {(apiKey) => (
                                <li class="border border-b-border bg-b-paper/40 shadow-[0_1px_0_rgba(0,0,0,0.35)] transition-colors hover:border-b-border-hover">
                                  <Show
                                    when={editingApiKeyId() !== apiKey.id}
                                    fallback={
                                      <form
                                        class="flex flex-col gap-3 p-4"
                                        onSubmit={(event) => {
                                          event.preventDefault();
                                          void handleRenameApiKey(apiKey);
                                        }}
                                      >
                                        <label
                                          for={`api-key-name-${apiKey.id}`}
                                          class="text-xs font-bold uppercase tracking-widest text-b-ink/70"
                                        >
                                          Key name
                                        </label>
                                        <input
                                          id={`api-key-name-${apiKey.id}`}
                                          type="text"
                                          required
                                          pattern={nameValidationPattern}
                                          value={editingApiKeyName()}
                                          onInput={(event) => {
                                            setEditingApiKeyName(
                                              event.currentTarget.value,
                                            );
                                            setEditKeyError(null);
                                          }}
                                          class="h-11 w-full border border-b-border bg-b-paper px-4 text-sm font-semibold text-b-ink placeholder:text-b-ink/25 outline-none transition-all duration-200 hover:border-b-border-hover focus-visible:border-b-accent/50 focus-visible:ring-2 focus-visible:ring-b-accent/20"
                                          title={nameValidationHint}
                                          autocomplete="off"
                                          autofocus
                                        />
                                        <Show when={editKeyError()}>
                                          <p class="border border-red-500/40 bg-red-500/10 px-3 py-3 text-xs font-bold uppercase leading-snug text-red-400">
                                            {editKeyError()}
                                          </p>
                                        </Show>
                                        <div class="flex flex-col gap-3 sm:flex-row sm:justify-end">
                                          <button
                                            type="button"
                                            onClick={cancelEditingApiKey}
                                            disabled={editKeyLoading()}
                                            class="btn btn-sm btn-interactive btn-disabled btn-secondary"
                                          >
                                            Cancel
                                          </button>
                                          <button
                                            type="submit"
                                            disabled={editKeyLoading()}
                                            class="btn btn-sm btn-interactive btn-disabled btn-primary"
                                          >
                                            <Show when={editKeyLoading()}>
                                              <LoadingSpinner class="size-3.5 text-b-paper" />
                                            </Show>
                                            {editKeyLoading()
                                              ? "Saving…"
                                              : "Save"}
                                          </button>
                                        </div>
                                      </form>
                                    }
                                  >
                                    <div class="flex flex-col gap-4 p-4 sm:flex-row sm:items-stretch sm:justify-between sm:gap-6">
                                      <div class="min-w-0 flex-1">
                                        <p class="font-['Anton',sans-serif] text-xl tracking-wide text-b-ink">
                                          {apiKey.name}
                                        </p>
                                        <p class="mt-1 text-xs font-semibold uppercase tracking-wider text-b-ink/40">
                                          Last used{" "}
                                          <span class="font-bold normal-case tracking-normal text-b-ink/70">
                                            {formatLastUsed(
                                              apiKey.lastUsedAt,
                                            )}
                                          </span>
                                        </p>
                                      </div>
                                      <div class="flex shrink-0 items-center justify-end gap-2 border-t border-b-border/60 pt-3 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0">
                                        <button
                                          type="button"
                                          onClick={() => setApiKeyToView(apiKey)}
                                          disabled={isBusy()}
                                          class="btn btn-sm btn-interactive btn-disabled btn-secondary"
                                          title="View API key"
                                        >
                                          <EyeIcon class="size-4" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            startEditingApiKey(apiKey)
                                          }
                                          disabled={isBusy()}
                                          class="btn btn-sm btn-interactive btn-disabled btn-secondary"
                                          title="Rename API key"
                                        >
                                          <PencilIcon class="size-4" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setDeleteKeyError(null);
                                            setApiKeyToDelete(apiKey);
                                          }}
                                          disabled={isBusy()}
                                          class="btn btn-sm btn-interactive btn-disabled btn-danger"
                                          title="Revoke API key"
                                        >
                                          <TrashIcon class="size-4" />
                                        </button>
                                      </div>
                                    </div>
                                  </Show>
                                </li>
                              )}
                            </For>
                          </ul>
                        </Show>
                      </div>
                    </div>
                  </Show>
                </section>
              </div>
            </Show>
          </div>
        </section>
      </div>

      {/* Create private key modal */}
      <Modal open={createPkOpen} onClose={closeCreatePkModal}>
        <p class="mb-2 text-xs font-bold uppercase tracking-[0.35em] text-b-accent">
          Create
        </p>
        <h3
          id="create-private-key-title"
          class="mb-8 font-['Anton',sans-serif] text-4xl uppercase leading-none tracking-wide text-b-ink"
        >
          New Private Key
        </h3>

        <form onSubmit={handleCreatePrivateKey} class="flex flex-col gap-6">
          <div class="flex items-center justify-between gap-4">
            <p class="text-xs font-bold uppercase tracking-widest text-b-ink/70">
              Derivation
            </p>
            <SegmentedControl
              options={[
                ...NAMED_DERIVATION_PATHS.map((namedPath) => ({
                  value: namedPath.id,
                  label: namedPath.label,
                })),
                { value: "manual", label: "Manual" },
              ]}
              value={createMode()}
              onChange={setCreateMode}
              disabled={pkLoading()}
            />
          </div>

          <Show
            when={createNamedPath()}
            fallback={
              <>
                <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div class="flex flex-col gap-2">
                    <label
                      for="new-private-key-curve"
                      class="text-xs font-bold uppercase tracking-widest text-b-ink/70"
                    >
                      Curve
                    </label>
                    <select
                      id="new-private-key-curve"
                      value={pkCurve()}
                      onChange={(e) =>
                        setPkCurve(e.currentTarget.value as DerivationCurve)
                      }
                      class="h-11 w-full appearance-none border border-b-border bg-b-field px-4 pr-10 text-sm font-bold tracking-widest text-b-ink outline-none focus-visible:border-b-accent/50 focus-visible:ring-2 focus-visible:ring-b-accent/20 hover:border-b-border-hover transition-all duration-200 cursor-pointer"
                    >
                      <option value="Secp256k1">Secp256k1</option>
                      <option value="Ed25519">Ed25519</option>
                    </select>
                  </div>

                  <div class="flex flex-col gap-2">
                    <label
                      for="new-private-key-address-format"
                      class="text-xs font-bold uppercase tracking-widest text-b-ink/70"
                    >
                      Address Format
                    </label>
                    <select
                      id="new-private-key-address-format"
                      value={pkAddressFormat()}
                      onChange={(e) =>
                        setPkAddressFormat(
                          e.currentTarget.value as AddressFormat,
                        )
                      }
                      class="h-11 w-full appearance-none border border-b-border bg-b-field px-4 pr-10 text-sm font-bold tracking-widest text-b-ink outline-none focus-visible:border-b-accent/50 focus-visible:ring-2 focus-visible:ring-b-accent/20 hover:border-b-border-hover transition-all duration-200 cursor-pointer"
                    >
                      <option value="Evm">Evm</option>
                      <option value="Solana">Solana</option>
                      <option value="Cosmos">Cosmos</option>
                    </select>
                  </div>
                </div>

                <div class="flex flex-col gap-2">
                  <label
                    for="new-private-key-path"
                    class="text-xs font-bold uppercase tracking-widest text-b-ink/70"
                  >
                    Derivation Path
                  </label>
                  <input
                    id="new-private-key-path"
                    type="text"
                    required
                    pattern={derivationPathPattern}
                    value={pkPath()}
                    onInput={(e) => {
                      setPkPath(e.currentTarget.value);
                      setPkError(null);
                    }}
                    class="h-11 w-full border border-b-border bg-b-field px-4 text-sm font-mono font-semibold text-b-ink placeholder:text-b-ink/25 outline-none focus-visible:border-b-accent/50 focus-visible:ring-2 focus-visible:ring-b-accent/20 hover:border-b-border-hover transition-all duration-200"
                    placeholder="m/44'/60'/0'/0/0"
                    title={derivationPathHint}
                    autocomplete="off"
                    spellcheck={false}
                    autofocus
                  />
                </div>
              </>
            }
          >
            <div class="flex flex-col gap-2">
              <label
                for="new-private-key-index"
                class="text-xs font-bold uppercase tracking-widest text-b-ink/70"
              >
                Index
              </label>
              <input
                id="new-private-key-index"
                type="number"
                required
                min={0}
                max={MAX_DERIVATION_INDEX}
                step={1}
                value={pkIndex()}
                onInput={(e) => {
                  setPkIndex(e.currentTarget.value);
                  setPkError(null);
                }}
                class="h-11 w-full border border-b-border bg-b-field px-4 text-sm font-mono font-semibold text-b-ink placeholder:text-b-ink/25 outline-none focus-visible:border-b-accent/50 focus-visible:ring-2 focus-visible:ring-b-accent/20 hover:border-b-border-hover transition-all duration-200"
                placeholder="0"
                autocomplete="off"
                autofocus
              />
              <Show when={createNamedPath()}>
                <p class="text-xs font-semibold uppercase tracking-wider text-b-ink/40">
                  Derives {createNamedPath()!.prefix}
                  {`{index}`}
                  {createNamedPath()!.hardenedIndex ? "'" : ""}
                  {createNamedPath()!.suffix} on {createNamedPath()!.curve} (
                  {createNamedPath()!.description})
                </p>
              </Show>
            </div>
          </Show>

          <Show when={pkError()}>
            <p class="border border-red-500/40 bg-red-500/10 px-3 py-3 text-xs font-bold uppercase leading-snug text-red-400">
              {pkError()}
            </p>
          </Show>

          <div class="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={closeCreatePkModal}
              disabled={pkLoading()}
              class="btn btn-md btn-interactive btn-disabled btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pkLoading()}
              class="btn btn-md btn-interactive btn-disabled btn-primary"
            >
              <Show when={pkLoading()}>
                <LoadingSpinner class="size-3.5 text-b-paper" />
              </Show>
              {pkLoading() ? "Creating…" : "Create"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Create API key modal */}
      <Modal open={createKeyOpen} onClose={closeCreateKeyModal}>
        <p class="mb-2 text-xs font-bold uppercase tracking-[0.35em] text-b-accent">
          Create
        </p>
        <h3
          id="create-api-key-title"
          class="mb-8 font-['Anton',sans-serif] text-4xl uppercase leading-none tracking-wide text-b-ink"
        >
          New API Key
        </h3>

        <form
          onSubmit={handleCreateApiKey}
          class="flex flex-col gap-6"
        >
          <div class="flex flex-col gap-2">
            <label
              for="new-key-name"
              class="text-xs font-bold uppercase tracking-widest text-b-ink/70"
            >
              Key name
            </label>
            <input
              id="new-key-name"
              type="text"
              required
              pattern={nameValidationPattern}
              value={newKeyName()}
              onInput={(event) => {
                setNewKeyName(event.currentTarget.value);
                setCreateKeyError(null);
              }}
              placeholder="Production integration"
              class="h-11 w-full border border-b-border bg-b-field px-4 text-sm font-semibold text-b-ink placeholder:text-b-ink/25 outline-none transition-all duration-200 hover:border-b-border-hover focus-visible:border-b-accent/50 focus-visible:ring-2 focus-visible:ring-b-accent/20"
              title={nameValidationHint}
              autocomplete="off"
              autofocus
            />
            <p class="text-xs font-semibold text-b-ink/45">
              Use a label that identifies the client or integration.
            </p>
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
              disabled={
                createKeyLoading() || newKeyName().trim().length === 0
              }
              class="btn btn-md btn-interactive btn-disabled btn-primary"
            >
              <Show when={createKeyLoading()}>
                <LoadingSpinner class="size-3.5 text-b-paper" />
              </Show>
              {createKeyLoading() ? "Creating…" : "Create Key"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete private key confirm modal */}
      <Modal
        open={() => pkToDelete() !== null}
        onClose={() => {
          if (!deletePkLoading()) setPkToDelete(null);
        }}
        danger
      >
        <p class="mb-2 text-xs font-bold uppercase tracking-[0.35em] text-red-400">
          Confirm Deletion
        </p>
        <h3
          id="delete-private-key-title"
          class="mb-4 font-['Anton',sans-serif] text-4xl uppercase leading-none tracking-wide text-b-ink"
        >
          Delete Private Key
        </h3>
        <p class="mb-4 text-sm font-semibold text-b-ink/70">
          Permanently delete{" "}
          <span class="font-mono font-bold text-red-400">
            {pkToDelete() ? formatDerivationPath(pkToDelete()!.derivationPath) : ""}
          </span>
          ? Its{" "}
          <span class="font-bold text-b-ink">
            {pkToDelete()?.apiKeys.length ?? 0} API key
            {pkToDelete()?.apiKeys.length === 1 ? "" : "s"}
          </span>{" "}
          will be revoked immediately.
        </p>

        <Show when={deletePkError()}>
          <p class="mb-6 border border-red-500/40 bg-red-500/10 px-3 py-3 text-xs font-bold uppercase leading-snug text-red-400">
            {deletePkError()}
          </p>
        </Show>

        <div class="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => setPkToDelete(null)}
            disabled={deletePkLoading()}
            class="btn btn-md btn-interactive btn-disabled btn-secondary"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleDeletePrivateKey()}
            disabled={deletePkLoading()}
            class="btn btn-md btn-interactive btn-disabled btn-danger"
          >
            <Show when={deletePkLoading()}>
              <LoadingSpinner class="size-3.5" />
            </Show>
            {deletePkLoading() ? "Deleting…" : "Delete"}
          </button>
        </div>
      </Modal>

      {/* Delete API key confirm modal */}
      <Modal
        open={() => apiKeyToDelete() !== null}
        onClose={() => {
          if (!deleteKeyLoading()) setApiKeyToDelete(null);
        }}
        danger
        zClass="z-[60]"
      >
        <p class="mb-2 text-xs font-bold uppercase tracking-[0.35em] text-red-400">
          Revoke Key
        </p>
        <h3
          id="delete-api-key-title"
          class="mb-4 font-['Anton',sans-serif] text-4xl uppercase leading-none tracking-wide text-b-ink"
        >
          {apiKeyToDelete()?.name}
        </h3>
        <p class="mb-4 text-sm font-semibold text-b-ink/70">
          Permanently revoke this key for private key{" "}
          <span class="font-mono font-bold text-red-400">
            {activePrivateKey()
              ? formatDerivationPath(activePrivateKey()!.derivationPath)
              : ""}
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
            onClick={() => void handleDeleteApiKey()}
            disabled={deleteKeyLoading()}
            class="btn btn-md btn-interactive btn-disabled btn-danger"
          >
            <Show when={deleteKeyLoading()}>
              <LoadingSpinner class="size-3.5" />
            </Show>
            {deleteKeyLoading() ? "Revoking…" : "Revoke key"}
          </button>
        </div>
      </Modal>

      <ApiKeyModal
        apiKey={apiKeyToView}
        onClose={() => setApiKeyToView(null)}
        loadKey={async (apiKeyId) => {
          const token = auth.token;
          const pkId = activePrivateKeyId();
          if (!token || !pkId) {
            throw new Error("Failed to load API key");
          }
          const response = await fetch(
            `/api/Wallets/${walletId()}/PrivateKeys/${pkId}/ApiKeys/${apiKeyId}/Key`,
            { headers: { Authorization: `Bearer ${token}` } },
          );
          if (!response.ok) {
            throw new Error(
              await readErrorMessage(response, "Failed to load API key"),
            );
          }
          const data = (await response.json()) as { key: string };
          return data.key;
        }}
        description="Anyone with access to this key can sign transactions and control this wallet."
      />

      <PrivateKeyModal
        privateKey={pkToView}
        onClose={() => setPkToView(null)}
        loadKey={async (privateKeyId) => {
          const token = auth.token;
          if (!token) {
            throw new Error("Failed to load private key");
          }
          const response = await fetch(
            `/api/Wallets/${walletId()}/PrivateKeys/${privateKeyId}/Key`,
            { headers: { Authorization: `Bearer ${token}` } },
          );
          if (!response.ok) {
            throw new Error(
              await readErrorMessage(response, "Failed to load private key"),
            );
          }
          const data = (await response.json()) as { key: string };
          return data.key;
        }}
      />
    </>
  );
}
