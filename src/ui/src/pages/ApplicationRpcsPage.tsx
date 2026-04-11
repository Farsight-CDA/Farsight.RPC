import { createEffect, createMemo, createSignal, For, Show } from "solid-js";
import { useParams } from "@solidjs/router";
import LoadingSpinner from "../components/LoadingSpinner";
import SearchIcon from "../components/icons/SearchIcon";
import PencilIcon from "../components/icons/PencilIcon";
import TrashIcon from "../components/icons/TrashIcon";
import LightningIcon from "../components/icons/LightningIcon";
import EmptyStateIcon from "../components/icons/EmptyStateIcon";
import ProviderIcon from "../components/icons/ProviderIcon";
import PlusIcon from "../components/icons/PlusIcon";
import ChevronDownIcon from "../components/icons/ChevronDownIcon";
import CheckmarkIcon from "../components/icons/CheckmarkIcon";
import WarningIcon from "../components/icons/WarningIcon";
import { useAuth } from "../lib/auth";
import {
  useReferenceData,
  type RpcStructureDefinition,
} from "../lib/reference-data";
import {
  useApplicationData,
  type ApplicationRpc,
} from "../lib/application-data";
import { useEnvironment } from "../lib/environment-context";

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
  return fallback;
}

const rpcValidationTimeoutMs = 15_000;
const rpcValidationTimedOutMessage = "RPC validation timed out.";

async function validateRpcEndpoint(
  token: string,
  address: string,
  chain: string,
  rpcType: ApplicationRpc["type"],
): Promise<{ ok: true; chainId: string } | { ok: false; message: string }> {
  const controller = new AbortController();
  const timeoutId = globalThis.setTimeout(
    () => controller.abort(),
    rpcValidationTimeoutMs,
  );

  try {
    const response = await fetch("/api/Rpcs/Validate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ address: address.trim(), chain, rpcType }),
      signal: controller.signal,
    });
    if (!response.ok) {
      return {
        ok: false,
        message: await readErrorMessage(response, "RPC validation failed"),
      };
    }
    const data = (await response.json()) as { chainId?: number | string };
    const chainId =
      data.chainId === undefined || data.chainId === null
        ? "unknown"
        : String(data.chainId);
    return { ok: true, chainId };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return { ok: false, message: rpcValidationTimedOutMessage };
    }

    throw error;
  } finally {
    globalThis.clearTimeout(timeoutId);
  }
}

const addressHint = "Enter a valid HTTP, HTTPS, WS, or WSS URL.";

function isValidRpcAddress(value: string): boolean {
  try {
    const url = new URL(value.trim());
    return ["http:", "https:", "ws:", "wss:"].includes(url.protocol);
  } catch {
    return false;
  }
}

function validateRpcAddressInput(input: HTMLInputElement): boolean {
  const valid = input.value.length === 0 || isValidRpcAddress(input.value);
  input.setCustomValidity(valid ? "" : addressHint);
  return valid;
}

export default function ApplicationRpcsPage() {
  const auth = useAuth();
  const referenceData = useReferenceData();
  const applicationData = useApplicationData();
  const params = useParams();
  const applicationId = () => params.applicationId;

  const allChains = referenceData.chains.data;
  const allChainsState = referenceData.chains.state;
  const allChainsError = referenceData.chains.error;
  const providers = referenceData.rpcProviders.data;
  const providersState = referenceData.rpcProviders.state;
  const providersError = referenceData.rpcProviders.error;
  const rpcs = applicationData.rpcs.data;
  const rpcsState = applicationData.rpcs.state;
  const rpcsError = applicationData.rpcs.error;

  const rpcStructures = referenceData.rpcStructures.data;
  const appStructures = applicationData.structures.data;

  const environment = useEnvironment();
  const selectedEnvironment = createMemo(
    () =>
      environment
        .environments()
        .find((item) => item.id === environment.selectedEnvironmentId()) ??
      null,
  );
  const [filterText, setFilterText] = createSignal("");
  const [activeChain, setActiveChain] = createSignal<string | null>(null);
  const [isAddingChains, setIsAddingChains] = createSignal(false);
  const [chainsToAdd, setChainsToAdd] = createSignal<Set<string>>(new Set());
  const [chainMutationError, setChainMutationError] = createSignal<
    string | null
  >(null);
  const [chainMutationLoading, setChainMutationLoading] = createSignal(false);

  const [createRpcModalOpen, setCreateRpcModalOpen] = createSignal(false);
  const [selectedChainForRpc, setSelectedChainForRpc] =
    createSignal<string>("");
  const [newRpcType, setNewRpcType] = createSignal<
    "Realtime" | "Archive" | "Tracing"
  >("Realtime");
  const [newRpcAddress, setNewRpcAddress] = createSignal("");
  const [newRpcProviderId, setNewRpcProviderId] = createSignal<string>("");
  const [newRpcTracingMode, setNewRpcTracingMode] = createSignal<
    "Debug" | "Trace"
  >("Debug");
  const [newRpcIndexerStepSize, setNewRpcIndexerStepSize] = createSignal("1");
  const [newRpcIndexerBlockOffset, setNewRpcIndexerBlockOffset] =
    createSignal("0");
  const [createRpcError, setCreateRpcError] = createSignal<string | null>(null);
  const [createRpcLoading, setCreateRpcLoading] = createSignal(false);
  const [createRpcTestStatus, setCreateRpcTestStatus] = createSignal<
    "untested" | "testing" | "passed" | "failed"
  >("untested");
  const [createRpcTestChainId, setCreateRpcTestChainId] = createSignal("");
  const [createRpcTestError, setCreateRpcTestError] = createSignal<
    string | null
  >(null);
  const [createRpcSaveConfirm, setCreateRpcSaveConfirm] = createSignal(false);

  const [editRpcModalOpen, setEditRpcModalOpen] = createSignal(false);
  const [rpcToEdit, setRpcToEdit] = createSignal<ApplicationRpc | null>(null);
  const [editRpcAddress, setEditRpcAddress] = createSignal("");
  const [editRpcProviderId, setEditRpcProviderId] = createSignal<string>("");
  const [editRpcTracingMode, setEditRpcTracingMode] = createSignal<
    "Debug" | "Trace"
  >("Debug");
  const [editRpcIndexerStepSize, setEditRpcIndexerStepSize] = createSignal("1");
  const [editRpcIndexerBlockOffset, setEditRpcIndexerBlockOffset] =
    createSignal("1");
  const [editRpcError, setEditRpcError] = createSignal<string | null>(null);
  const [editRpcLoading, setEditRpcLoading] = createSignal(false);
  const [editRpcTestStatus, setEditRpcTestStatus] = createSignal<
    "untested" | "testing" | "passed" | "failed"
  >("untested");
  const [editRpcTestChainId, setEditRpcTestChainId] = createSignal("");
  const [editRpcTestError, setEditRpcTestError] = createSignal<string | null>(
    null,
  );
  const [editRpcSaveConfirm, setEditRpcSaveConfirm] = createSignal(false);

  let newRpcAddressInput!: HTMLInputElement;
  let editRpcAddressInput!: HTMLInputElement;

  const [rpcToDelete, setRpcToDelete] = createSignal<ApplicationRpc | null>(
    null,
  );
  const [deleteRpcError, setDeleteRpcError] = createSignal<string | null>(null);
  const [deleteRpcLoading, setDeleteRpcLoading] = createSignal(false);

  const [chainToDisable, setChainToDisable] = createSignal<string | null>(null);
  const [disableChainError, setDisableChainError] = createSignal<string | null>(
    null,
  );
  const [disableChainLoading, setDisableChainLoading] = createSignal(false);

  createEffect(() => {
    const prods = providers();
    if (prods.length > 0 && !newRpcProviderId()) {
      setNewRpcProviderId(prods[0].id);
    }
  });

  const availableChains = createMemo(() => {
    const uniqueChains = new Set(selectedEnvironment()?.chains ?? []);
    return Array.from(uniqueChains).sort((a, b) => a.localeCompare(b));
  });

  const inactiveChains = createMemo(() => {
    const activeChains = new Set(selectedEnvironment()?.chains ?? []);
    return Array.from(new Set(allChains()))
      .filter((chain) => !activeChains.has(chain))
      .sort((a, b) => a.localeCompare(b));
  });

  const getChainRpcs = (chain: string, environment: string) => {
    return rpcs().filter(
      (rpc) => rpc.chain === chain && rpc.environmentId === environment,
    );
  };

  const filteredChains = createMemo(() => {
    const allChains = availableChains();
    const filter = filterText().trim().toLowerCase();
    let list = allChains;
    if (filter) {
      list = list.filter((chain) => chain.toLowerCase().includes(filter));
    }
    return list;
  });

  const filteredInactiveChains = createMemo(() => {
    const chains = inactiveChains();
    const filter = filterText().trim().toLowerCase();
    let list = chains;
    if (filter) {
      list = list.filter((chain) => chain.toLowerCase().includes(filter));
    }
    return list;
  });

  createEffect(() => {
    const list = filteredChains();
    const current = activeChain();
    if (list.length === 0) {
      setActiveChain(null);
      return;
    }
    if (!current || !list.includes(current)) {
      setActiveChain(list[0]);
    }
  });

  const activeChainRpcs = createMemo(() => {
    const chain = activeChain();
    const env = environment.selectedEnvironmentId() || "";
    if (!chain) return [];
    return getChainRpcs(chain, env);
  });

  type ChainStructureStatus = "valid" | "warning";

  const getChainTypeCounts = (
    chain: string,
    env: string,
  ): Record<string, number> => {
    const chainRpcs = rpcs().filter(
      (rpc) => rpc.chain === chain && rpc.environmentId === env,
    );
    const counts: Record<string, number> = {};
    for (const rpc of chainRpcs) {
      counts[rpc.type] = (counts[rpc.type] ?? 0) + 1;
    }
    return counts;
  };

  const matchesStructure = (
    typeCounts: Record<string, number>,
    definition: RpcStructureDefinition,
  ): boolean => {
    const required = definition.requiredRpcTypes;
    const requiredKeys = Object.keys(required);
    const actualKeys = Object.keys(typeCounts);
    if (requiredKeys.length !== actualKeys.length) return false;
    for (const key of requiredKeys) {
      if ((typeCounts[key] ?? 0) !== required[key]) return false;
    }
    for (const key of actualKeys) {
      if (!(key in required)) return false;
    }
    return true;
  };

  const chainStructureStatuses = createMemo(() => {
    const env = environment.selectedEnvironmentId() || "";
    const supported = appStructures();
    const definitions = rpcStructures();
    const statuses: Record<string, ChainStructureStatus> = {};

    if (supported.length === 0) return statuses;

    const supportedDefs = definitions.filter((d) =>
      supported.includes(d.structure),
    );

    for (const chain of availableChains()) {
      const typeCounts = getChainTypeCounts(chain, env);
      const matches = supportedDefs.some((def) =>
        matchesStructure(typeCounts, def),
      );
      statuses[chain] = matches ? "valid" : "warning";
    }

    return statuses;
  });

  const chainMatchedStructures = createMemo(() => {
    const env = environment.selectedEnvironmentId() || "";
    const supported = appStructures();
    const definitions = rpcStructures();
    const matches: Record<string, string | null> = {};

    if (supported.length === 0) return matches;

    const supportedDefs = definitions.filter((d) =>
      supported.includes(d.structure),
    );

    for (const chain of availableChains()) {
      const typeCounts = getChainTypeCounts(chain, env);
      const matchedDef = supportedDefs.find((def) =>
        matchesStructure(typeCounts, def),
      );
      matches[chain] = matchedDef?.structure ?? null;
    }

    return matches;
  });

  const activeChainMatchedStructure = createMemo(() => {
    const chain = activeChain();
    const env = environment.selectedEnvironmentId() || "";
    if (!chain) return null;

    const supported = appStructures();
    const definitions = rpcStructures();
    if (supported.length === 0) return null;

    const typeCounts = getChainTypeCounts(chain, env);

    const supportedDefs = definitions.filter((d) =>
      supported.includes(d.structure),
    );
    return (
      supportedDefs.find((def) => matchesStructure(typeCounts, def)) ?? null
    );
  });

  const activeChainMismatchInfo = createMemo(() => {
    const chain = activeChain();
    const env = environment.selectedEnvironmentId() || "";
    if (!chain) return null;

    const supported = appStructures();
    const definitions = rpcStructures();
    if (supported.length === 0) return null;

    const typeCounts = getChainTypeCounts(chain, env);

    const supportedDefs = definitions.filter((d) =>
      supported.includes(d.structure),
    );
    if (supportedDefs.some((def) => matchesStructure(typeCounts, def)))
      return null;

    return { typeCounts, supportedDefs };
  });

  const toggleAddChainsMode = () => {
    setChainMutationError(null);
    setChainsToAdd(new Set<string>());
    setIsAddingChains(!isAddingChains());
  };

  const cancelAddChains = () => {
    if (chainMutationLoading()) return;
    setIsAddingChains(false);
    setChainsToAdd(new Set<string>());
  };

  const toggleChainSelection = (chain: string) => {
    const current = new Set<string>(chainsToAdd());
    if (current.has(chain)) {
      current.delete(chain);
    } else {
      current.add(chain);
    }
    setChainsToAdd(current);
  };

  const handleAddChains = async () => {
    const environmentId = environment.selectedEnvironmentId();
    const chains = Array.from(chainsToAdd());
    if (!environmentId || chains.length === 0) return;

    setChainMutationError(null);
    setChainMutationLoading(true);
    try {
      // Add chains one by one
      for (const chain of chains) {
        await applicationData.addEnvironmentChain(environmentId, chain);
      }
      // Activate the first added chain
      setActiveChain(chains[0]);
      setIsAddingChains(false);
      setChainsToAdd(new Set<string>());
    } catch (err) {
      setChainMutationError(
        err instanceof Error ? err.message : "Failed to add chains",
      );
    } finally {
      setChainMutationLoading(false);
    }
  };

  const handleDisableChain = async (chain: string) => {
    const environmentId = environment.selectedEnvironmentId();
    if (!environmentId) return;

    // Check if chain has RPCs
    const chainRpcs = getChainRpcs(chain, environmentId);
    if (chainRpcs.length > 0) {
      // Show confirmation modal if RPCs exist
      setDisableChainError(null);
      setChainToDisable(chain);
      return;
    }

    // Disable directly if no RPCs
    await performDisableChain(chain);
  };

  const performDisableChain = async (chain: string) => {
    const environmentId = environment.selectedEnvironmentId();
    if (!environmentId) return;

    setChainMutationError(null);
    setDisableChainLoading(true);
    try {
      await applicationData.removeEnvironmentChain(environmentId, chain);
      setChainToDisable(null);
    } catch (err) {
      setChainMutationError(
        err instanceof Error ? err.message : "Failed to disable chain",
      );
    } finally {
      setDisableChainLoading(false);
    }
  };

  const openCreateRpcModal = (chain: string) => {
    setCreateRpcError(null);
    setCreateRpcTestStatus("untested");
    setCreateRpcTestChainId("");
    setCreateRpcTestError(null);
    setCreateRpcSaveConfirm(false);
    setSelectedChainForRpc(chain);
    setNewRpcType("Realtime");
    setNewRpcAddress("");
    setNewRpcTracingMode("Debug");
    setNewRpcIndexerStepSize("1");
    setNewRpcIndexerBlockOffset("0");
    const prods = providers();
    if (prods.length > 0) {
      setNewRpcProviderId(prods[0].id);
    }
    setCreateRpcModalOpen(true);
  };

  const closeCreateRpcModal = () => {
    if (createRpcLoading()) return;
    setCreateRpcTestStatus("untested");
    setCreateRpcTestChainId("");
    setCreateRpcTestError(null);
    setCreateRpcSaveConfirm(false);
    setCreateRpcModalOpen(false);
    setSelectedChainForRpc("");
  };

  const openEditRpcModal = async (rpc: ApplicationRpc) => {
    setEditRpcError(null);
    setEditRpcTestStatus("untested");
    setEditRpcTestChainId("");
    setEditRpcTestError(null);
    setEditRpcSaveConfirm(false);
    setRpcToEdit(rpc);
    setEditRpcAddress(rpc.address);
    setEditRpcProviderId(rpc.providerId);
    setEditRpcTracingMode(
      rpc.type === "Tracing" && rpc.tracingMode === "Trace" ? "Trace" : "Debug",
    );
    setEditRpcIndexerStepSize(
      rpc.type === "Archive" && rpc.indexerStepSize
        ? String(rpc.indexerStepSize)
        : "1",
    );
    setEditRpcIndexerBlockOffset(
      rpc.type === "Archive" && rpc.indexerBlockOffset !== undefined
        ? String(rpc.indexerBlockOffset)
        : "1",
    );
    setEditRpcModalOpen(true);

    if (isValidRpcAddress(rpc.address)) {
      const token = auth.token;
      if (token) {
        setEditRpcTestStatus("testing");
        try {
          const result = await validateRpcEndpoint(
            token,
            rpc.address,
            rpc.chain,
            rpc.type,
          );
          if (result.ok) {
            setEditRpcTestStatus("passed");
            setEditRpcTestChainId(result.chainId);
          } else {
            setEditRpcTestStatus("failed");
            setEditRpcTestError(result.message);
          }
        } catch (err) {
          setEditRpcTestStatus("failed");
          setEditRpcTestError(
            err instanceof Error ? err.message : "RPC validation failed",
          );
        }
      }
    }
  };

  const closeEditRpcModal = () => {
    if (editRpcLoading()) return;
    setEditRpcTestStatus("untested");
    setEditRpcTestChainId("");
    setEditRpcTestError(null);
    setEditRpcSaveConfirm(false);
    setEditRpcModalOpen(false);
    setRpcToEdit(null);
  };

  const runCreateRpcTest = async () => {
    const token = auth.token;
    if (!token) return;
    const chain = selectedChainForRpc();
    if (!chain) return;
    const address = newRpcAddress().trim();
    if (!isValidRpcAddress(address)) {
      setCreateRpcError(addressHint);
      newRpcAddressInput.setCustomValidity(addressHint);
      newRpcAddressInput.reportValidity();
      return;
    }
    setCreateRpcError(null);
    setCreateRpcTestStatus("testing");
    setCreateRpcTestChainId("");
    setCreateRpcTestError(null);
    setCreateRpcSaveConfirm(false);
    try {
      const result = await validateRpcEndpoint(
        token,
        address,
        chain,
        newRpcType(),
      );
      if (result.ok) {
        setCreateRpcTestStatus("passed");
        setCreateRpcTestChainId(result.chainId);
      } else {
        setCreateRpcTestStatus("failed");
        setCreateRpcTestError(result.message);
      }
    } catch (err) {
      setCreateRpcTestStatus("failed");
      setCreateRpcTestError(
        err instanceof Error ? err.message : "RPC validation failed",
      );
    }
  };

  const runEditRpcTest = async () => {
    const token = auth.token;
    const rpc = rpcToEdit();
    if (!token || !rpc) return;
    const address = editRpcAddress().trim();
    if (!isValidRpcAddress(address)) {
      setEditRpcError(addressHint);
      editRpcAddressInput.setCustomValidity(addressHint);
      editRpcAddressInput.reportValidity();
      return;
    }
    setEditRpcError(null);
    setEditRpcTestStatus("testing");
    setEditRpcTestChainId("");
    setEditRpcTestError(null);
    setEditRpcSaveConfirm(false);
    try {
      const result = await validateRpcEndpoint(
        token,
        address,
        rpc.chain,
        rpc.type,
      );
      if (result.ok) {
        setEditRpcTestStatus("passed");
        setEditRpcTestChainId(result.chainId);
      } else {
        setEditRpcTestStatus("failed");
        setEditRpcTestError(result.message);
      }
    } catch (err) {
      setEditRpcTestStatus("failed");
      setEditRpcTestError(
        err instanceof Error ? err.message : "RPC validation failed",
      );
    }
  };

  const handleCreateRpc = async (e: SubmitEvent) => {
    e.preventDefault();
    const token = auth.token;
    const app = applicationId();
    const env = environment.selectedEnvironmentId();
    const providerId = newRpcProviderId();
    const chain = selectedChainForRpc();
    const rpcType = newRpcType();
    if (!token || !app || !env || !providerId || !chain) return;

    const address = newRpcAddress().trim();
    if (!isValidRpcAddress(address)) {
      setCreateRpcError(addressHint);
      newRpcAddressInput.setCustomValidity(addressHint);
      newRpcAddressInput.reportValidity();
      return;
    }

    if (
      createRpcTestStatus() === "untested" ||
      createRpcTestStatus() === "testing"
    ) {
      return;
    }
    if (createRpcTestStatus() === "failed" && !createRpcSaveConfirm()) {
      setCreateRpcSaveConfirm(true);
      return;
    }

    const body: Record<string, number | string> = {
      environmentId: env,
      chain,
      address,
      providerId,
    };

    if (rpcType === "Tracing") {
      body.tracingMode = newRpcTracingMode();
    }

    if (rpcType === "Archive") {
      body.indexerStepSize = Number.parseInt(newRpcIndexerStepSize(), 10);
      body.indexerBlockOffset = Number.parseInt(newRpcIndexerBlockOffset(), 10);
    }

    setCreateRpcError(null);
    setCreateRpcLoading(true);
    try {
      const response = await fetch(`/api/Applications/${app}/Rpcs/${rpcType}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        throw new Error(
          await readErrorMessage(response, "Failed to create RPC"),
        );
      }
      await applicationData.refreshRpcs();
      await referenceData.refreshRpcProviders();
      setCreateRpcModalOpen(false);
      setNewRpcAddress("");
      setActiveChain(chain);
    } catch (err) {
      setCreateRpcError(
        err instanceof Error ? err.message : "Failed to create RPC",
      );
    } finally {
      setCreateRpcLoading(false);
    }
  };

  const handleEditRpc = async (e: SubmitEvent) => {
    e.preventDefault();
    const token = auth.token;
    const app = applicationId();
    const rpc = rpcToEdit();
    if (!token || !app || !rpc) return;

    const address = editRpcAddress().trim();
    if (!isValidRpcAddress(address)) {
      setEditRpcError(addressHint);
      editRpcAddressInput.setCustomValidity(addressHint);
      editRpcAddressInput.reportValidity();
      return;
    }

    if (
      editRpcTestStatus() === "untested" ||
      editRpcTestStatus() === "testing"
    ) {
      return;
    }
    if (editRpcTestStatus() === "failed" && !editRpcSaveConfirm()) {
      setEditRpcSaveConfirm(true);
      return;
    }

    setEditRpcError(null);
    setEditRpcLoading(true);
    try {
      const body: Record<string, number | string> = {
        address,
        providerId: editRpcProviderId(),
      };

      if (rpc.type === "Tracing") {
        body.tracingMode = editRpcTracingMode();
      }

      if (rpc.type === "Archive") {
        body.indexerStepSize = Number.parseInt(editRpcIndexerStepSize(), 10);
        body.indexerBlockOffset = Number.parseInt(
          editRpcIndexerBlockOffset(),
          10,
        );
      }

      const response = await fetch(
        `/api/Applications/${app}/Rpcs/${rpc.type}/${rpc.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        },
      );
      if (!response.ok) {
        throw new Error(
          await readErrorMessage(response, "Failed to update RPC"),
        );
      }
      await applicationData.refreshRpcs();
      await referenceData.refreshRpcProviders();
      setEditRpcModalOpen(false);
      setRpcToEdit(null);
    } catch (err) {
      setEditRpcError(
        err instanceof Error ? err.message : "Failed to update RPC",
      );
    } finally {
      setEditRpcLoading(false);
    }
  };

  const handleDeleteRpc = async () => {
    const token = auth.token;
    const app = applicationId();
    const rpc = rpcToDelete();
    if (!token || !app || !rpc) return;

    setDeleteRpcError(null);
    setDeleteRpcLoading(true);
    try {
      const response = await fetch(`/api/Applications/${app}/Rpcs/${rpc.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        throw new Error(
          await readErrorMessage(response, "Failed to delete RPC"),
        );
      }
      setRpcToDelete(null);
      await applicationData.refreshRpcs();
      await referenceData.refreshRpcProviders();
    } catch (err) {
      setDeleteRpcError(
        err instanceof Error ? err.message : "Failed to delete RPC",
      );
    } finally {
      setDeleteRpcLoading(false);
    }
  };

  const getProviderName = (providerId: string) => {
    const provider = providers().find((p) => p.id === providerId);
    return provider?.name ?? "Unknown";
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Realtime":
        return "text-green-400 border-green-500/30 bg-green-500/10";
      case "Archive":
        return "text-blue-400 border-blue-500/30 bg-blue-500/10";
      case "Tracing":
        return "text-purple-400 border-purple-500/30 bg-purple-500/10";
      default:
        return "text-b-ink/50 border-b-border bg-b-field";
    }
  };

  return (
    <>
      <div class="flex flex-col gap-6">
        <Show
          when={allChainsState() === "pending" || rpcsState() === "pending"}
        >
          <div class="flex flex-col items-center justify-center gap-4 py-16">
            <LoadingSpinner class="size-8" />
            <p class="text-sm font-bold uppercase tracking-widest text-b-ink/80">
              Loading chains and RPCs…
            </p>
          </div>
        </Show>

        <Show
          when={
            allChainsState() === "refreshing" || rpcsState() === "refreshing"
          }
        >
          <div class="flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-b-ink/80">
            <LoadingSpinner class="size-4" />
            Updating…
          </div>
        </Show>

        <Show when={allChainsError()}>
          <div class="mx-auto max-w-md">
            <p class="border-4 border-red-500/50 bg-red-500/10 px-4 py-4 text-center text-xs font-bold uppercase leading-snug text-red-400">
              {allChainsError()!.message}
            </p>
          </div>
        </Show>

        <Show when={rpcsError()}>
          <div class="mx-auto max-w-md">
            <p class="border-4 border-red-500/50 bg-red-500/10 px-4 py-4 text-center text-xs font-bold uppercase leading-snug text-red-400">
              {rpcsError()!.message}
            </p>
          </div>
        </Show>

        <Show when={chainMutationError()}>
          <div class="mx-auto max-w-md">
            <p class="border-4 border-red-500/50 bg-red-500/10 px-4 py-4 text-center text-xs font-bold uppercase leading-snug text-red-400">
              {chainMutationError()}
            </p>
          </div>
        </Show>

        <Show
          when={
            !allChainsError() &&
            !rpcsError() &&
            environment.environmentsState() === "ready" &&
            environment.environments().length === 0
          }
        >
          <div class="flex flex-col items-center justify-center gap-4 border border-dashed border-b-border/50 bg-b-field/30 py-16">
            <EmptyStateIcon class="size-12 text-b-ink/20" />
            <p class="text-center text-sm font-semibold uppercase tracking-wider text-b-ink/50">
              Add an environment before configuring RPCs.
            </p>
          </div>
        </Show>

        <Show
          when={
            !allChainsError() &&
            !rpcsError() &&
            environment.environments().length > 0 &&
            (allChainsState() === "ready" ||
              allChainsState() === "refreshing") &&
            (rpcsState() === "ready" || rpcsState() === "refreshing")
          }
        >
          <div class="flex flex-col gap-4 lg:flex-row lg:items-stretch lg:gap-6">
            <aside class="flex max-h-[min(22rem,52vh)] flex-col overflow-hidden border border-b-border bg-b-field lg:max-h-[calc(100vh-13rem)] lg:w-72 lg:shrink-0">
              <div class="shrink-0 space-y-3 border-b border-b-border p-4">
                <div class="flex items-center justify-between gap-2">
                  <p class="text-xs font-bold uppercase tracking-[0.35em] text-b-accent">
                    <Show when={isAddingChains()} fallback="Chains">
                      Add Chains
                    </Show>
                  </p>
                  <span class="tabular-nums text-[0.65rem] font-bold uppercase tracking-widest text-b-ink/45">
                    <Show
                      when={isAddingChains()}
                      fallback={`${filteredChains().length}/${availableChains().length}`}
                    >
                      {chainsToAdd().size}/{filteredInactiveChains().length}
                    </Show>
                  </span>
                </div>
                <div class="relative">
                  <input
                    type="text"
                    value={filterText()}
                    onInput={(e) => setFilterText(e.currentTarget.value)}
                    placeholder="Filter chains..."
                    class="h-10 w-full border border-b-border bg-b-paper px-3 pr-10 text-sm font-semibold text-b-ink placeholder:text-b-ink/25 outline-none focus-visible:border-b-accent/50 focus-visible:ring-2 focus-visible:ring-b-accent/20 hover:border-b-border-hover transition-all duration-200"
                  />
                  <div class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                    <SearchIcon class="size-4 text-b-ink/30" />
                  </div>
                </div>
              </div>
              <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2 [scrollbar-gutter:stable]">
                {/* Toggle Add Mode Button */}
                <Show
                  when={!isAddingChains()}
                  fallback={
                    <button
                      type="button"
                      onClick={cancelAddChains}
                      disabled={chainMutationLoading()}
                      class="mb-1 flex w-full items-center justify-center gap-2 border border-dashed border-b-border/50 bg-b-paper/10 px-3 py-2.5 text-left transition-all duration-150 hover:border-red-500/50 hover:bg-red-500/10"
                    >
                      <span class="text-xs font-bold uppercase tracking-wider text-b-ink/70">
                        Cancel
                      </span>
                    </button>
                  }
                >
                  <button
                    type="button"
                    onClick={toggleAddChainsMode}
                    disabled={
                      chainMutationLoading() || inactiveChains().length === 0
                    }
                    class="mb-1 flex w-full items-center justify-center gap-2 border border-dashed border-b-border/50 bg-b-paper/10 px-3 py-2.5 text-left transition-all duration-150 hover:border-b-accent/50 hover:bg-b-accent/5 disabled:opacity-40"
                  >
                    <PlusIcon class="size-4 text-b-accent" />
                    <span class="text-xs font-bold uppercase tracking-wider text-b-accent">
                      Add Chain
                    </span>
                  </button>
                </Show>

                {/* Active Chains List */}
                <Show when={!isAddingChains()}>
                  <For each={filteredChains()}>
                    {(chain) => {
                      const isActive = () => activeChain() === chain;
                      const structureStatus = () =>
                        chainStructureStatuses()[chain] ?? "warning";
                      const isWarning = () => structureStatus() === "warning";
                      const matchedStructure = () =>
                        chainMatchedStructures()[chain];
                      return (
                        <div
                          role="button"
                          tabindex="0"
                          onClick={() => setActiveChain(chain)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              setActiveChain(chain);
                            }
                          }}
                          class={`group mb-1 flex w-full cursor-pointer items-center justify-between border px-3 py-2.5 text-left transition-all duration-150 last:mb-0 ${
                            isActive()
                              ? isWarning()
                                ? "border-red-500/50 bg-red-500/20 text-b-ink shadow-[inset_2px_0_0_0_var(--color-red-500)]"
                                : "border-b-accent bg-b-accent/10 text-b-ink shadow-[inset_2px_0_0_0_var(--color-b-accent)]"
                              : isWarning()
                                ? "border-red-500/30 bg-red-500/10 text-b-ink/85 hover:border-red-500/50 hover:bg-red-500/20"
                                : "border-transparent bg-b-paper/15 text-b-ink/85 hover:border-b-border-hover hover:bg-b-paper/35"
                          }`}
                        >
                          <div class="flex min-w-0 flex-1 items-center gap-2">
                            <Show when={structureStatus() === "valid"}>
                              <span title="Matches a supported structure">
                                <CheckmarkIcon class="size-4 shrink-0 text-green-400" />
                              </span>
                            </Show>
                            <Show when={structureStatus() === "warning"}>
                              <span title="Does not match any supported structure">
                                <WarningIcon class="size-4 shrink-0 text-red-400" />
                              </span>
                            </Show>
                            <span class="min-w-0 truncate font-['Anton',sans-serif] text-base uppercase tracking-wide">
                              {chain}
                            </span>
                            <Show when={matchedStructure()}>
                              {(structure) => (
                                <span class="ml-1 inline-flex shrink-0 items-center border border-green-500/30 bg-green-500/10 px-1.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider text-green-400">
                                  {structure()}
                                </span>
                              )}
                            </Show>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              void handleDisableChain(chain);
                            }}
                            disabled={
                              chainMutationLoading() ||
                              createRpcLoading() ||
                              deleteRpcLoading() ||
                              editRpcLoading()
                            }
                            class="ml-2 shrink-0 opacity-0 transition-opacity duration-150 hover:text-red-400 group-hover:opacity-100 focus:opacity-100 disabled:opacity-30"
                            title={`Disable ${chain}`}
                          >
                            <TrashIcon class="size-4" />
                          </button>
                        </div>
                      );
                    }}
                  </For>
                </Show>

                {/* Inactive Chains List (Add Mode) */}
                <Show when={isAddingChains()}>
                  <Show
                    when={filteredInactiveChains().length > 0}
                    fallback={
                      <div class="border border-dashed border-b-border/50 bg-b-paper/10 px-3 py-4 text-center">
                        <p class="text-xs font-semibold uppercase tracking-wider text-b-ink/50">
                          No available chains to add
                        </p>
                      </div>
                    }
                  >
                    <For each={filteredInactiveChains()}>
                      {(chain) => {
                        const isSelected = () => chainsToAdd().has(chain);
                        return (
                          <div
                            role="button"
                            tabindex="0"
                            onClick={() => toggleChainSelection(chain)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                toggleChainSelection(chain);
                              }
                            }}
                            class={`group mb-1 flex w-full cursor-pointer items-center gap-3 border px-3 py-2.5 text-left transition-all duration-150 last:mb-0 ${
                              isSelected()
                                ? "border-b-accent bg-b-accent/10 text-b-ink shadow-[inset_2px_0_0_0_var(--color-b-accent)]"
                                : "border-transparent bg-b-paper/15 text-b-ink/85 hover:border-b-border-hover hover:bg-b-paper/35"
                            }`}
                          >
                            <div
                              class={`flex size-4 shrink-0 items-center justify-center border transition-all duration-150 ${
                                isSelected()
                                  ? "border-b-accent bg-b-accent"
                                  : "border-b-border bg-b-paper"
                              }`}
                            >
                              <Show when={isSelected()}>
                                <CheckmarkIcon class="size-3 text-b-paper" />
                              </Show>
                            </div>
                            <span class="min-w-0 truncate font-['Anton',sans-serif] text-base uppercase tracking-wide">
                              {chain}
                            </span>
                          </div>
                        );
                      }}
                    </For>
                  </Show>
                </Show>
              </div>

              {/* Add Selected Button */}
              <Show when={isAddingChains()}>
                <div class="shrink-0 border-t border-b-border p-2">
                  <button
                    type="button"
                    onClick={handleAddChains}
                    disabled={
                      chainMutationLoading() || chainsToAdd().size === 0
                    }
                    class="flex w-full items-center justify-center gap-2 border border-b-accent bg-b-accent px-3 py-2.5 text-left transition-all duration-150 hover:bg-b-accent-hover disabled:opacity-40"
                  >
                    <Show when={chainMutationLoading()}>
                      <LoadingSpinner class="size-3.5 text-b-paper" />
                    </Show>
                    <span class="text-xs font-bold uppercase tracking-wider text-b-paper">
                      {chainMutationLoading()
                        ? "Adding…"
                        : `Add Selected (${chainsToAdd().size})`}
                    </span>
                  </button>
                </div>
              </Show>
            </aside>

            <section class="flex min-h-[min(24rem,55vh)] min-w-0 flex-1 flex-col overflow-hidden border border-b-border bg-b-field lg:min-h-[calc(100vh-13rem)]">
              <Show
                when={activeChain()}
                fallback={
                  <div class="flex flex-1 flex-col items-center justify-center gap-3 p-10">
                    <Show
                      when={availableChains().length > 0}
                      fallback={
                        <>
                          <LightningIcon class="size-10 text-b-ink/20" />
                          <p class="text-center text-sm font-semibold uppercase tracking-wider text-b-ink/50">
                            No chains added for this environment.
                          </p>
                          <button
                            type="button"
                            onClick={toggleAddChainsMode}
                            disabled={
                              chainMutationLoading() ||
                              inactiveChains().length === 0
                            }
                            class="btn btn-md btn-interactive btn-disabled btn-primary"
                          >
                            <PlusIcon class="size-4" />
                            Add Chain
                          </button>
                        </>
                      }
                    >
                      <Show
                        when={filteredChains().length > 0}
                        fallback={
                          <>
                            <SearchIcon class="size-10 text-b-ink/20" />
                            <p class="text-center text-sm font-semibold uppercase tracking-wider text-b-ink/50">
                              No chains match your filter.
                            </p>
                          </>
                        }
                      >
                        <>
                          <EmptyStateIcon class="size-10 text-b-ink/20" />
                          <p class="text-center text-xs font-semibold uppercase tracking-wider text-b-ink/45">
                            Select a chain from the list
                          </p>
                        </>
                      </Show>
                    </Show>
                  </div>
                }
              >
                <div class="flex min-h-0 flex-1 flex-col">
                  <div class="flex shrink-0 flex-col gap-3 border-b border-b-border p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div class="min-w-0">
                      <p class="text-[0.65rem] font-bold uppercase tracking-[0.35em] text-b-accent">
                        Chain
                      </p>
                      <h2 class="flex items-center gap-2 truncate font-['Anton',sans-serif] text-2xl uppercase tracking-wide text-b-ink">
                        {activeChain()}
                        <Show
                          when={
                            chainStructureStatuses()[activeChain()!] === "valid"
                          }
                        >
                          <span title="Matches a supported structure">
                            <CheckmarkIcon class="size-5 shrink-0 text-green-400" />
                          </span>
                        </Show>
                        <Show
                          when={
                            chainStructureStatuses()[activeChain()!] ===
                            "warning"
                          }
                        >
                          <span title="Does not match any supported structure">
                            <WarningIcon class="size-5 shrink-0 text-red-400" />
                          </span>
                        </Show>
                      </h2>
                      <p class="mt-1 text-[0.65rem] font-bold uppercase tracking-widest text-b-ink/45">
                        {activeChainRpcs().length} RPC
                        {activeChainRpcs().length !== 1 ? "s" : ""} ·{" "}
                        {selectedEnvironment()?.name}
                      </p>
                    </div>
                    <div class="flex shrink-0 flex-col gap-2 self-start sm:self-center">
                      <button
                        type="button"
                        onClick={() => {
                          const ch = activeChain();
                          if (ch) openCreateRpcModal(ch);
                        }}
                        disabled={
                          providersState() === "pending" ||
                          createRpcLoading() ||
                          deleteRpcLoading() ||
                          editRpcLoading() ||
                          !selectedEnvironment()
                        }
                        class="btn btn-sm btn-interactive btn-disabled btn-primary"
                      >
                        <PlusIcon class="size-4" />
                        Add RPC
                      </button>
                    </div>
                  </div>
                  <Show when={activeChainMatchedStructure()}>
                    {(matched) => (
                      <div class="mx-4 mt-4 flex items-center gap-2 border border-green-500/30 bg-green-500/10 px-3 py-2">
                        <CheckmarkIcon class="size-4 shrink-0 text-green-400" />
                        <p class="text-xs font-bold uppercase tracking-wider text-green-400">
                          Matches {matched().structure}
                        </p>
                      </div>
                    )}
                  </Show>
                  <Show when={activeChainMismatchInfo()}>
                    {(info) => (
                      <div class="mx-4 mt-4 flex items-start gap-2 border border-red-500/30 bg-red-500/10 px-3 py-3">
                        <WarningIcon class="size-4 shrink-0 text-red-400 mt-0.5" />
                        <div class="flex-1">
                          <p class="text-xs font-bold uppercase tracking-wider text-red-400">
                            Does not match any supported structure
                          </p>
                          <Show
                            when={Object.entries(info().typeCounts).length > 0}
                            fallback={
                              <p class="mt-2 text-[0.65rem] font-bold uppercase tracking-wider text-b-ink/50">
                                Has no RPCs configured yet
                              </p>
                            }
                          >
                            <div class="mt-2 flex flex-wrap items-center gap-1 text-[0.6rem] font-bold uppercase tracking-wider text-b-ink/50">
                              <span>Has:</span>
                              <For each={Object.entries(info().typeCounts)}>
                                {([type, count]) => (
                                  <span class="border border-b-border bg-b-paper/20 px-1.5 py-0.5">
                                    {count}x {type}
                                  </span>
                                )}
                              </For>
                            </div>
                          </Show>
                          <div class="mt-1.5 flex flex-col gap-1">
                            <For each={info().supportedDefs}>
                              {(def) => (
                                <div class="flex flex-wrap items-center gap-1 text-[0.6rem] font-bold uppercase tracking-wider text-b-ink/40">
                                  <span>{def.structure} needs:</span>
                                  <For
                                    each={Object.entries(def.requiredRpcTypes)}
                                  >
                                    {([type, count]) => (
                                      <span class="border border-b-border/50 bg-b-paper/10 px-1.5 py-0.5">
                                        {count}x {type}
                                      </span>
                                    )}
                                  </For>
                                </div>
                              )}
                            </For>
                          </div>
                        </div>
                      </div>
                    )}
                  </Show>
                  <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 [scrollbar-gutter:stable]">
                    <Show when={activeChainRpcs().length > 0}>
                      <div class="flex flex-col gap-3">
                        <For each={activeChainRpcs()}>
                          {(rpc) => (
                            <div class="flex flex-col gap-3 border border-b-border bg-b-paper/20 p-4 sm:flex-row sm:items-start sm:justify-between transition-colors hover:border-b-border-hover">
                              <div class="min-w-0 flex-1">
                                <div class="flex flex-wrap items-center gap-2">
                                  <span
                                    class={`inline-flex items-center border px-2 py-0.5 text-xs font-bold uppercase tracking-wider ${getTypeColor(rpc.type)}`}
                                  >
                                    {rpc.type}
                                  </span>
                                  <span class="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-b-ink/50">
                                    <ProviderIcon class="size-3.5" />
                                    {getProviderName(rpc.providerId)}
                                  </span>
                                </div>
                                <div class="mt-3">
                                  <code class="break-all font-mono text-xs font-semibold text-b-ink/80">
                                    {rpc.address}
                                  </code>
                                </div>
                                <Show
                                  when={
                                    rpc.type === "Tracing" && rpc.tracingMode
                                  }
                                >
                                  <div class="mt-2 flex items-center gap-4 text-xs font-semibold uppercase tracking-wider text-b-ink/40">
                                    <span>Mode: {rpc.tracingMode}</span>
                                  </div>
                                </Show>
                                <Show when={rpc.type === "Archive"}>
                                  <div class="mt-2 flex items-center gap-4 text-xs font-semibold uppercase tracking-wider text-b-ink/40">
                                <Show when={rpc.indexerStepSize}>
                                  <span>Step: {rpc.indexerStepSize}</span>
                                </Show>
                                <Show when={rpc.indexerBlockOffset !== undefined}>
                                  <span>
                                    Offset: {rpc.indexerBlockOffset}
                                  </span>
                                    </Show>
                                  </div>
                                </Show>
                              </div>
                              <div class="flex shrink-0 items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => openEditRpcModal(rpc)}
                                  disabled={
                                    createRpcLoading() ||
                                    deleteRpcLoading() ||
                                    editRpcLoading()
                                  }
                                  class="btn btn-sm btn-interactive btn-disabled btn-secondary"
                                  title="Edit RPC"
                                >
                                  <PencilIcon class="size-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setDeleteRpcError(null);
                                    setRpcToDelete(rpc);
                                  }}
                                  disabled={
                                    createRpcLoading() ||
                                    deleteRpcLoading() ||
                                    editRpcLoading()
                                  }
                                  class="btn btn-sm btn-interactive btn-disabled btn-danger"
                                  title="Delete RPC"
                                >
                                  <TrashIcon class="size-4" />
                                </button>
                              </div>
                            </div>
                          )}
                        </For>
                      </div>
                    </Show>

                    <Show when={activeChainRpcs().length === 0}>
                      <div class="flex flex-col items-center justify-center gap-3 border border-dashed border-b-border/50 bg-b-field/30 py-12">
                        <EmptyStateIcon class="size-8 text-b-ink/20" />
                        <p class="text-xs font-semibold uppercase tracking-wider text-b-ink/50">
                          No RPCs configured for this chain
                        </p>
                      </div>
                    </Show>
                  </div>
                </div>
              </Show>
            </section>
          </div>
        </Show>
      </div>

      <Show when={createRpcModalOpen()}>
        <div
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4 py-8"
          role="presentation"
          onClick={closeCreateRpcModal}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-rpc-title"
            class="w-full max-w-lg border border-b-border bg-b-field p-8 shadow-[0_25px_50px_rgba(0,0,0,0.5)]"
            onClick={(e) => e.stopPropagation()}
          >
            <p class="mb-2 text-xs font-bold uppercase tracking-[0.35em] text-b-accent">
              Create
            </p>
            <h3
              id="create-rpc-title"
              class="mb-2 font-['Anton',sans-serif] text-4xl uppercase leading-none tracking-wide text-b-ink"
            >
              New RPC
            </h3>
            <p class="mb-6 text-xs font-bold uppercase tracking-widest text-b-ink/50">
              {selectedChainForRpc()} / {selectedEnvironment()?.name}
            </p>

            <form onSubmit={handleCreateRpc} class="flex flex-col gap-6">
              <div class="flex flex-col gap-2">
                <label class="text-xs font-bold uppercase tracking-widest text-b-ink/70">
                  Type
                </label>
                <div class="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewRpcType("Realtime")}
                    class={`px-4 py-3 text-xs font-bold uppercase tracking-wider border transition-all duration-200 ${
                      newRpcType() === "Realtime"
                        ? "border-green-500/50 bg-green-500/10 text-green-400"
                        : "border-b-border bg-b-paper text-b-ink/50 hover:border-b-border-hover hover:text-b-ink"
                    }`}
                  >
                    Realtime
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewRpcType("Archive")}
                    class={`px-4 py-3 text-xs font-bold uppercase tracking-wider border transition-all duration-200 ${
                      newRpcType() === "Archive"
                        ? "border-blue-500/50 bg-blue-500/10 text-blue-400"
                        : "border-b-border bg-b-paper text-b-ink/50 hover:border-b-border-hover hover:text-b-ink"
                    }`}
                  >
                    Archive
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewRpcType("Tracing")}
                    class={`px-4 py-3 text-xs font-bold uppercase tracking-wider border transition-all duration-200 ${
                      newRpcType() === "Tracing"
                        ? "border-purple-500/50 bg-purple-500/10 text-purple-400"
                        : "border-b-border bg-b-paper text-b-ink/50 hover:border-b-border-hover hover:text-b-ink"
                    }`}
                  >
                    Tracing
                  </button>
                </div>
              </div>

              <div class="flex flex-col gap-2">
                <label
                  for="rpc-provider"
                  class="text-xs font-bold uppercase tracking-widest text-b-ink/70"
                >
                  Provider
                </label>
                <Show when={providersState() === "pending"}>
                  <div class="flex h-11 items-center gap-2 border border-b-border bg-b-field px-3">
                    <LoadingSpinner class="size-4" />
                    <span class="text-xs font-bold uppercase tracking-widest text-b-ink/50">
                      Loading providers…
                    </span>
                  </div>
                </Show>
                <Show when={providersError()}>
                  <p class="border border-red-500/40 bg-red-500/10 px-3 py-3 text-xs font-bold uppercase leading-snug text-red-400">
                    {providersError()!.message}
                  </p>
                </Show>
                <Show
                  when={providersState() === "ready" && providers().length > 0}
                >
                  <div class="relative">
                    <select
                      id="rpc-provider"
                      value={newRpcProviderId()}
                      onChange={(e) =>
                        setNewRpcProviderId(e.currentTarget.value)
                      }
                      class="h-11 w-full appearance-none border border-b-border bg-b-field px-4 pr-10 text-sm font-bold uppercase tracking-widest text-b-ink outline-none focus-visible:border-b-accent/50 focus-visible:ring-2 focus-visible:ring-b-accent/20 hover:border-b-border-hover transition-all duration-200 cursor-pointer"
                    >
                      <For each={providers()}>
                        {(provider) => (
                          <option value={provider.id} class="bg-b-field">
                            {provider.name}
                          </option>
                        )}
                      </For>
                    </select>
                    <div class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                      <ChevronDownIcon class="size-5 text-b-ink/50" />
                    </div>
                  </div>
                </Show>
                <Show
                  when={
                    providersState() === "ready" && providers().length === 0
                  }
                >
                  <div class="flex flex-col gap-3 border border-dashed border-b-border/50 bg-b-paper/20 px-4 py-4">
                    <p class="text-xs font-bold uppercase tracking-widest text-b-ink/50">
                      No providers available.
                    </p>
                    <a
                      href={`/applications/${applicationId()}/providers`}
                      onClick={closeCreateRpcModal}
                      class="text-xs font-bold uppercase tracking-widest text-b-accent hover:text-b-accent-hover hover:underline transition-colors"
                    >
                      Create a provider first →
                    </a>
                  </div>
                </Show>
              </div>

              <div class="flex flex-col gap-2">
                <label
                  for="rpc-address"
                  class="text-xs font-bold uppercase tracking-widest text-b-ink/70"
                >
                  Address
                </label>
                <input
                  ref={newRpcAddressInput}
                  id="rpc-address"
                  type="url"
                  required
                  value={newRpcAddress()}
                  onInput={(e) => {
                    setNewRpcAddress(e.currentTarget.value);
                    validateRpcAddressInput(e.currentTarget);
                    if (createRpcError() === addressHint)
                      setCreateRpcError(null);
                    setCreateRpcTestStatus("untested");
                    setCreateRpcTestChainId("");
                    setCreateRpcTestError(null);
                    setCreateRpcSaveConfirm(false);
                  }}
                  onBlur={(e) => {
                    validateRpcAddressInput(e.currentTarget);
                    if (isValidRpcAddress(newRpcAddress().trim())) {
                      void runCreateRpcTest();
                    }
                  }}
                  class="h-11 w-full border border-b-border bg-b-paper px-4 text-sm font-semibold text-b-ink placeholder:text-b-ink/25 outline-none focus-visible:border-b-accent/50 focus-visible:ring-2 focus-visible:ring-b-accent/20 hover:border-b-border-hover transition-all duration-200"
                  placeholder="https://rpc.example.com"
                  title={addressHint}
                  autocomplete="off"
                />
                <p class="text-xs font-semibold uppercase tracking-wider text-b-ink/40">
                  {addressHint}
                </p>
                <Show when={createRpcTestStatus() === "testing"}>
                  <div class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-b-ink/50">
                    <LoadingSpinner class="size-3.5" />
                    <span>Testing endpoint…</span>
                  </div>
                </Show>
                <Show when={createRpcTestStatus() === "passed"}>
                  <div class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-green-400">
                    <CheckmarkIcon class="size-3.5" />
                    <span>Looks correct</span>
                  </div>
                </Show>
                <Show when={createRpcTestStatus() === "failed"}>
                  <div class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-300">
                    <WarningIcon class="size-3.5" />
                    <span>{createRpcTestError() ?? "RPC validation failed"}</span>
                  </div>
                </Show>
              </div>

              <Show when={newRpcType() === "Tracing"}>
                <div class="flex flex-col gap-2">
                  <label
                    for="rpc-tracing-mode"
                    class="text-xs font-bold uppercase tracking-widest text-b-ink/70"
                  >
                    Tracing Mode
                  </label>
                  <div class="relative">
                    <select
                      id="rpc-tracing-mode"
                      value={newRpcTracingMode()}
                      onChange={(e) =>
                        setNewRpcTracingMode(
                          e.currentTarget.value as "Debug" | "Trace",
                        )
                      }
                      class="h-11 w-full appearance-none border border-b-border bg-b-field px-4 pr-10 text-sm font-bold uppercase tracking-widest text-b-ink outline-none focus-visible:border-b-accent/50 focus-visible:ring-2 focus-visible:ring-b-accent/20 hover:border-b-border-hover transition-all duration-200 cursor-pointer"
                    >
                      <option value="Debug" class="bg-b-field">
                        Debug
                      </option>
                      <option value="Trace" class="bg-b-field">
                        Trace
                      </option>
                    </select>
                    <div class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                      <ChevronDownIcon class="size-5 text-b-ink/50" />
                    </div>
                  </div>
                </div>
              </Show>

              <Show when={newRpcType() === "Archive"}>
                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div class="flex flex-col gap-2">
                    <label
                      for="rpc-indexer-step-size"
                      class="text-xs font-bold uppercase tracking-widest text-b-ink/70"
                    >
                      Indexer Step
                    </label>
                    <input
                      id="rpc-indexer-step-size"
                      type="number"
                      min="1"
                      required={newRpcType() === "Archive"}
                      value={newRpcIndexerStepSize()}
                      onInput={(e) =>
                        setNewRpcIndexerStepSize(e.currentTarget.value)
                      }
                      class="h-11 w-full border border-b-border bg-b-paper px-4 text-sm font-semibold text-b-ink placeholder:text-b-ink/25 outline-none focus-visible:border-b-accent/50 focus-visible:ring-2 focus-visible:ring-b-accent/20 hover:border-b-border-hover transition-all duration-200"
                      inputmode="numeric"
                    />
                  </div>
                  <div class="flex flex-col gap-2">
                    <label
                      for="rpc-indexer-block-offset"
                      class="text-xs font-bold uppercase tracking-widest text-b-ink/70"
                    >
                      Block Offset
                    </label>
                    <input
                      id="rpc-indexer-block-offset"
                      type="number"
                      min="0"
                      required={newRpcType() === "Archive"}
                      value={newRpcIndexerBlockOffset()}
                      onInput={(e) =>
                        setNewRpcIndexerBlockOffset(e.currentTarget.value)
                      }
                      class="h-11 w-full border border-b-border bg-b-paper px-4 text-sm font-semibold text-b-ink placeholder:text-b-ink/25 outline-none focus-visible:border-b-accent/50 focus-visible:ring-2 focus-visible:ring-b-accent/20 hover:border-b-border-hover transition-all duration-200"
                      inputmode="numeric"
                    />
                  </div>
                </div>
              </Show>

              <Show when={createRpcError()}>
                <p class="border border-red-500/40 bg-red-500/10 px-3 py-3 text-xs font-bold uppercase leading-snug text-red-400">
                  {createRpcError()}
                </p>
              </Show>

              <div class="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeCreateRpcModal}
                  disabled={createRpcLoading()}
                  class="btn btn-md btn-interactive btn-disabled btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    createRpcLoading() ||
                    !newRpcProviderId() ||
                    createRpcTestStatus() === "untested" ||
                    createRpcTestStatus() === "testing"
                  }
                  class={`btn btn-md btn-interactive btn-disabled ${
                    createRpcTestStatus() === "failed" &&
                    !createRpcSaveConfirm()
                      ? "btn-warning"
                      : createRpcTestStatus() === "failed" &&
                          createRpcSaveConfirm()
                        ? "btn-danger"
                        : "btn-primary"
                  }`}
                >
                  <Show when={createRpcLoading()}>
                    <LoadingSpinner class="size-3.5 text-b-paper" />
                  </Show>
                  {createRpcLoading()
                    ? "Creating…"
                    : createRpcTestStatus() === "failed" &&
                        !createRpcSaveConfirm()
                      ? "Test Failed - Click to Save Anyway"
                      : createRpcTestStatus() === "failed" &&
                          createRpcSaveConfirm()
                        ? "Confirm Save (Test Failed)"
                        : "Create RPC"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Show>

      <Show when={editRpcModalOpen() && rpcToEdit()}>
        <div
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4 py-8"
          role="presentation"
          onClick={closeEditRpcModal}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-rpc-title"
            class="w-full max-w-lg border border-b-border bg-b-field p-8 shadow-[0_25px_50px_rgba(0,0,0,0.5)]"
            onClick={(e) => e.stopPropagation()}
          >
            <p class="mb-2 text-xs font-bold uppercase tracking-[0.35em] text-b-accent">
              Edit
            </p>
            <h3
              id="edit-rpc-title"
              class="mb-8 font-['Anton',sans-serif] text-4xl uppercase leading-none tracking-wide text-b-ink"
            >
              Edit RPC
            </h3>

            <form onSubmit={handleEditRpc} class="flex flex-col gap-6">
              <div class="flex flex-col gap-2">
                <label class="text-xs font-bold uppercase tracking-widest text-b-ink/70">
                  Type
                </label>
                <div class="flex h-11 items-center border border-b-border bg-b-field px-4">
                  <span
                    class={`text-sm font-bold uppercase tracking-wider ${
                      rpcToEdit()?.type === "Realtime"
                        ? "text-green-400"
                        : rpcToEdit()?.type === "Archive"
                          ? "text-blue-400"
                          : "text-purple-400"
                    }`}
                  >
                    {rpcToEdit()?.type}
                  </span>
                </div>
              </div>

              <div class="flex flex-col gap-2">
                <label
                  for="edit-rpc-provider"
                  class="text-xs font-bold uppercase tracking-widest text-b-ink/70"
                >
                  Provider
                </label>
                <Show
                  when={providersState() === "ready" && providers().length > 0}
                >
                  <div class="relative">
                    <select
                      id="edit-rpc-provider"
                      value={editRpcProviderId()}
                      onChange={(e) =>
                        setEditRpcProviderId(e.currentTarget.value)
                      }
                      class="h-11 w-full appearance-none border border-b-border bg-b-field px-4 pr-10 text-sm font-bold uppercase tracking-widest text-b-ink outline-none focus-visible:border-b-accent/50 focus-visible:ring-2 focus-visible:ring-b-accent/20 hover:border-b-border-hover transition-all duration-200 cursor-pointer"
                    >
                      <For each={providers()}>
                        {(provider) => (
                          <option value={provider.id} class="bg-b-field">
                            {provider.name}
                          </option>
                        )}
                      </For>
                    </select>
                    <div class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                      <ChevronDownIcon class="size-5 text-b-ink/50" />
                    </div>
                  </div>
                </Show>
                <Show
                  when={
                    providersState() === "ready" && providers().length === 0
                  }
                >
                  <div class="flex flex-col gap-3 border border-dashed border-b-border/50 bg-b-paper/20 px-4 py-4">
                    <p class="text-xs font-bold uppercase tracking-widest text-b-ink/50">
                      No providers available.
                    </p>
                    <a
                      href={`/applications/${applicationId()}/providers`}
                      onClick={closeEditRpcModal}
                      class="text-xs font-bold uppercase tracking-widest text-b-accent hover:text-b-accent-hover hover:underline transition-colors"
                    >
                      Create a provider first →
                    </a>
                  </div>
                </Show>
              </div>

              <div class="flex flex-col gap-2">
                <label
                  for="edit-rpc-address"
                  class="text-xs font-bold uppercase tracking-widest text-b-ink/70"
                >
                  Address
                </label>
                <input
                  ref={editRpcAddressInput}
                  id="edit-rpc-address"
                  type="url"
                  required
                  value={editRpcAddress()}
                  onInput={(e) => {
                    setEditRpcAddress(e.currentTarget.value);
                    validateRpcAddressInput(e.currentTarget);
                    if (editRpcError() === addressHint) setEditRpcError(null);
                    setEditRpcTestStatus("untested");
                    setEditRpcTestChainId("");
                    setEditRpcTestError(null);
                    setEditRpcSaveConfirm(false);
                  }}
                  onBlur={(e) => {
                    validateRpcAddressInput(e.currentTarget);
                    if (isValidRpcAddress(editRpcAddress().trim())) {
                      void runEditRpcTest();
                    }
                  }}
                  class="h-11 w-full border border-b-border bg-b-paper px-4 text-sm font-semibold text-b-ink placeholder:text-b-ink/25 outline-none focus-visible:border-b-accent/50 focus-visible:ring-2 focus-visible:ring-b-accent/20 hover:border-b-border-hover transition-all duration-200"
                  placeholder="https://rpc.example.com"
                  title={addressHint}
                  autocomplete="off"
                />
                <p class="text-xs font-semibold uppercase tracking-wider text-b-ink/40">
                  {addressHint}
                </p>
                <Show when={editRpcTestStatus() === "testing"}>
                  <div class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-b-ink/50">
                    <LoadingSpinner class="size-3.5" />
                    <span>Testing endpoint…</span>
                  </div>
                </Show>
                <Show when={editRpcTestStatus() === "passed"}>
                  <div class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-green-400">
                    <CheckmarkIcon class="size-3.5" />
                    <span>Looks correct</span>
                  </div>
                </Show>
                <Show when={editRpcTestStatus() === "failed"}>
                  <div class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-300">
                    <WarningIcon class="size-3.5" />
                    <span>{editRpcTestError() ?? "RPC validation failed"}</span>
                  </div>
                </Show>
              </div>

              <Show when={rpcToEdit()?.type === "Tracing"}>
                <div class="flex flex-col gap-2">
                  <label
                    for="edit-rpc-tracing-mode"
                    class="text-xs font-bold uppercase tracking-widest text-b-ink/70"
                  >
                    Tracing Mode
                  </label>
                  <div class="relative">
                    <select
                      id="edit-rpc-tracing-mode"
                      value={editRpcTracingMode()}
                      onChange={(e) =>
                        setEditRpcTracingMode(
                          e.currentTarget.value as "Debug" | "Trace",
                        )
                      }
                      class="h-11 w-full appearance-none border border-b-border bg-b-field px-4 pr-10 text-sm font-bold uppercase tracking-widest text-b-ink outline-none focus-visible:border-b-accent/50 focus-visible:ring-2 focus-visible:ring-b-accent/20 hover:border-b-border-hover transition-all duration-200 cursor-pointer"
                    >
                      <option value="Debug" class="bg-b-field">
                        Debug
                      </option>
                      <option value="Trace" class="bg-b-field">
                        Trace
                      </option>
                    </select>
                    <div class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                      <ChevronDownIcon class="size-5 text-b-ink/50" />
                    </div>
                  </div>
                </div>
              </Show>

              <Show when={rpcToEdit()?.type === "Archive"}>
                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div class="flex flex-col gap-2">
                    <label
                      for="edit-rpc-indexer-step-size"
                      class="text-xs font-bold uppercase tracking-widest text-b-ink/70"
                    >
                      Indexer Step
                    </label>
                    <input
                      id="edit-rpc-indexer-step-size"
                      type="number"
                      min="1"
                      required={rpcToEdit()?.type === "Archive"}
                      value={editRpcIndexerStepSize()}
                      onInput={(e) =>
                        setEditRpcIndexerStepSize(e.currentTarget.value)
                      }
                      class="h-11 w-full border border-b-border bg-b-paper px-4 text-sm font-semibold text-b-ink placeholder:text-b-ink/25 outline-none focus-visible:border-b-accent/50 focus-visible:ring-2 focus-visible:ring-b-accent/20 hover:border-b-border-hover transition-all duration-200"
                      inputmode="numeric"
                    />
                  </div>
                  <div class="flex flex-col gap-2">
                    <label
                      for="edit-rpc-indexer-block-offset"
                      class="text-xs font-bold uppercase tracking-widest text-b-ink/70"
                    >
                      Block Offset
                    </label>
                    <input
                      id="edit-rpc-indexer-block-offset"
                      type="number"
                      min="0"
                      required={rpcToEdit()?.type === "Archive"}
                      value={editRpcIndexerBlockOffset()}
                      onInput={(e) =>
                        setEditRpcIndexerBlockOffset(e.currentTarget.value)
                      }
                      class="h-11 w-full border border-b-border bg-b-paper px-4 text-sm font-semibold text-b-ink placeholder:text-b-ink/25 outline-none focus-visible:border-b-accent/50 focus-visible:ring-2 focus-visible:ring-b-accent/20 hover:border-b-border-hover transition-all duration-200"
                      inputmode="numeric"
                    />
                  </div>
                </div>
              </Show>

              <Show when={editRpcError()}>
                <p class="border border-red-500/40 bg-red-500/10 px-3 py-3 text-xs font-bold uppercase leading-snug text-red-400">
                  {editRpcError()}
                </p>
              </Show>

              <div class="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeEditRpcModal}
                  disabled={editRpcLoading()}
                  class="btn btn-md btn-interactive btn-disabled btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    editRpcLoading() ||
                    editRpcTestStatus() === "untested" ||
                    editRpcTestStatus() === "testing"
                  }
                  class={`btn btn-md btn-interactive btn-disabled ${
                    editRpcTestStatus() === "failed" && !editRpcSaveConfirm()
                      ? "btn-warning"
                      : editRpcTestStatus() === "failed" && editRpcSaveConfirm()
                        ? "btn-danger"
                        : "btn-primary"
                  }`}
                >
                  <Show when={editRpcLoading()}>
                    <LoadingSpinner class="size-3.5 text-b-paper" />
                  </Show>
                  {editRpcLoading()
                    ? "Saving…"
                    : editRpcTestStatus() === "failed" && !editRpcSaveConfirm()
                      ? "Test Failed - Click to Save Anyway"
                      : editRpcTestStatus() === "failed" && editRpcSaveConfirm()
                        ? "Confirm Save (Test Failed)"
                        : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Show>

      <Show when={rpcToDelete()}>
        <div
          class="fixed inset-0 z-[55] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4 py-8"
          role="presentation"
          onClick={() => !deleteRpcLoading() && setRpcToDelete(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-rpc-title"
            class="w-full max-w-md border border-red-500/30 bg-b-field p-8 shadow-[0_25px_50px_rgba(0,0,0,0.5)]"
            onClick={(e) => e.stopPropagation()}
          >
            <p class="mb-2 text-xs font-bold uppercase tracking-[0.35em] text-red-400">
              Confirm Deletion
            </p>
            <h3
              id="delete-rpc-title"
              class="mb-4 font-['Anton',sans-serif] text-4xl uppercase leading-none tracking-wide text-b-ink"
            >
              Delete RPC
            </h3>
            <p class="mb-4 text-sm font-semibold text-b-ink/70">
              Permanently delete this{" "}
              <span class="font-bold text-red-400">{rpcToDelete()?.type}</span>{" "}
              RPC endpoint?
            </p>
            <p class="mb-8 text-xs font-mono text-b-ink/40 break-all">
              {rpcToDelete()?.address}
            </p>

            <Show when={deleteRpcError()}>
              <p class="mb-6 border border-red-500/40 bg-red-500/10 px-3 py-3 text-xs font-bold uppercase leading-snug text-red-400">
                {deleteRpcError()}
              </p>
            </Show>

            <div class="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setRpcToDelete(null)}
                disabled={deleteRpcLoading()}
                class="btn btn-md btn-interactive btn-disabled btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteRpc}
                disabled={deleteRpcLoading()}
                class="btn btn-md btn-interactive btn-disabled btn-danger"
              >
                <Show when={deleteRpcLoading()}>
                  <LoadingSpinner class="size-3.5" />
                </Show>
                {deleteRpcLoading() ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      </Show>

      <Show when={chainToDisable()}>
        <div
          class="fixed inset-0 z-[55] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4 py-8"
          role="presentation"
          onClick={() => !disableChainLoading() && setChainToDisable(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="disable-chain-title"
            class="w-full max-w-md border border-amber-500/30 bg-b-field p-8 shadow-[0_25px_50px_rgba(0,0,0,0.5)]"
            onClick={(e) => e.stopPropagation()}
          >
            <p class="mb-2 text-xs font-bold uppercase tracking-[0.35em] text-amber-400">
              Confirm Disable
            </p>
            <h3
              id="disable-chain-title"
              class="mb-4 font-['Anton',sans-serif] text-4xl uppercase leading-none tracking-wide text-b-ink"
            >
              Disable Chain
            </h3>
            <p class="mb-4 text-sm font-semibold text-b-ink/70">
              Disable chain{" "}
              <span class="font-bold text-amber-400">{chainToDisable()}</span>{" "}
              for {selectedEnvironment()?.name}?
            </p>
            <div class="mb-6 border border-amber-500/20 bg-amber-500/10 px-3 py-3">
              <p class="text-xs font-semibold text-amber-300/80">
                Existing RPCs will be preserved and can be restored by
                re-enabling the chain.
              </p>
            </div>

            <Show when={disableChainError()}>
              <p class="mb-6 border border-red-500/40 bg-red-500/10 px-3 py-3 text-xs font-bold uppercase leading-snug text-red-400">
                {disableChainError()}
              </p>
            </Show>

            <div class="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setChainToDisable(null)}
                disabled={disableChainLoading()}
                class="btn btn-md btn-interactive btn-disabled btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const chain = chainToDisable();
                  if (chain) void performDisableChain(chain);
                }}
                disabled={disableChainLoading()}
                class="btn btn-md btn-interactive btn-disabled btn-warning"
              >
                <Show when={disableChainLoading()}>
                  <LoadingSpinner class="size-3.5" />
                </Show>
                {disableChainLoading() ? "Disabling…" : "Disable Chain"}
              </button>
            </div>
          </div>
        </div>
      </Show>
    </>
  );
}
