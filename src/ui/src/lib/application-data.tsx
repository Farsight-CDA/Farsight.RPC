import { useParams } from "@solidjs/router";
import {
  Show,
  createContext,
  createEffect,
  createMemo,
  createSignal,
  untrack,
  useContext,
  type Accessor,
  type ParentProps,
  type Setter,
} from "solid-js";
import LoadingSpinner from "../components/LoadingSpinner";
import { useAuth } from "./auth";

type LoadState = "idle" | "pending" | "refreshing" | "ready" | "errored";

export type ApplicationEnvironmentSummary = {
  id: string;
  name: string;
  chains: string[];
};

export type ConsumerApiKeySummary = {
  id: string;
  environmentId: string;
  key: string;
  lastUsedAt?: string;
};

export type ApplicationRpc = {
  id: string;
  type: "Realtime" | "Archive" | "Tracing";
  environmentId: string;
  chain: string;
  address: string;
  providerId: string;
  applicationId: string;
  tracingMode?: string;
  indexerStepSize?: number;
  dexIndexerStepSize?: number;
  indexerBlockOffset?: number;
};

type ApplicationDetail = {
  id: string;
  name: string;
  environments: ApplicationEnvironmentSummary[];
  apiKeys: ConsumerApiKeySummary[];
  structures: string[];
};

type ListController<T> = {
  data: Accessor<T[]>;
  state: Accessor<LoadState>;
  error: Accessor<Error | null>;
};

type ApplicationDataContextValue = {
  applicationId: Accessor<string | undefined>;
  environments: ListController<ApplicationEnvironmentSummary>;
  selectedEnvironmentId: Accessor<string | undefined>;
  setSelectedEnvironmentId: Setter<string | undefined>;
  apiKeys: ListController<ConsumerApiKeySummary>;
  rpcs: ListController<ApplicationRpc>;
  rpcsByEnvironment: Accessor<Record<string, ApplicationRpc[]>>;
  structures: ListController<string>;
  refreshDetail: () => Promise<void>;
  refreshApiKeys: () => Promise<void>;
  refreshEnvironments: () => Promise<void>;
  refreshStructures: () => Promise<void>;
  refreshRpcs: () => Promise<void>;
  refresh: () => Promise<void>;
  addEnvironmentChain: (environmentId: string, chain: string) => Promise<void>;
  removeEnvironmentChain: (environmentId: string, chain: string) => Promise<void>;
};

const ApplicationDataContext = createContext<ApplicationDataContextValue>();

async function fetchApplicationList<T>(
  path: string,
  token: string,
  fallbackMessage: string,
): Promise<T[]> {
  const response = await fetch(path, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error(fallbackMessage);
  }

  return response.json() as Promise<T[]>;
}

async function fetchApplicationDetail(
  id: string,
  token: string,
): Promise<ApplicationDetail> {
  const response = await fetch(`/api/Applications/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error("Failed to load application");
  }

  return response.json() as Promise<ApplicationDetail>;
}

async function readErrorMessage(
  response: Response,
  fallbackMessage: string,
): Promise<string> {
  try {
    const data = (await response.json()) as {
      message?: string;
      errors?: Record<string, string[]>;
    };
    if (data.message && data.message !== "One or more errors occurred!") {
      return data.message;
    }
    const first = data.errors && Object.values(data.errors).flat()[0];
    if (first) {
      return first;
    }
  } catch {}

  return fallbackMessage;
}

export function ApplicationDataProvider(props: ParentProps) {
  const auth = useAuth();
  const params = useParams();
  const applicationId = () => params.applicationId;

  const [environments, setEnvironments] = createSignal<
    ApplicationEnvironmentSummary[]
  >([]);
  const [environmentsState, setEnvironmentsState] =
    createSignal<LoadState>("idle");
  const [environmentsError, setEnvironmentsError] = createSignal<Error | null>(
    null,
  );

  const [apiKeys, setApiKeys] = createSignal<ConsumerApiKeySummary[]>([]);
  const [apiKeysState, setApiKeysState] = createSignal<LoadState>("idle");
  const [apiKeysError, setApiKeysError] = createSignal<Error | null>(null);

  const [structures, setStructures] = createSignal<string[]>([]);
  const [structuresState, setStructuresState] = createSignal<LoadState>("idle");
  const [structuresError, setStructuresError] = createSignal<Error | null>(null);

  const [loadedDetailKey, setLoadedDetailKey] = createSignal<string | null>(null);
  let activeDetailLoad: Promise<void> | null = null;
  let activeDetailLoadKey: string | null = null;

  const [rpcs, setRpcs] = createSignal<ApplicationRpc[]>([]);
  const [rpcsState, setRpcsState] = createSignal<LoadState>("idle");
  const [rpcsError, setRpcsError] = createSignal<Error | null>(null);
  const [loadedRpcsKey, setLoadedRpcsKey] = createSignal<string | null>(null);
  let activeRpcsLoad: Promise<void> | null = null;
  let activeRpcsLoadKey: string | null = null;

  const [selectedEnvironmentId, setSelectedEnvironmentId] = createSignal<
    string | undefined
  >(undefined);

  const clearDetail = () => {
    setSelectedEnvironmentId(undefined);
    setEnvironments([]);
    setEnvironmentsState("idle");
    setEnvironmentsError(null);
    setApiKeys([]);
    setApiKeysState("idle");
    setApiKeysError(null);
    setStructures([]);
    setStructuresState("idle");
    setStructuresError(null);
    setLoadedDetailKey(null);
  };

  const clearRpcs = () => {
    setRpcs([]);
    setRpcsState("idle");
    setRpcsError(null);
    setLoadedRpcsKey(null);
  };

  const clear = () => {
    clearDetail();
    clearRpcs();
  };

  const refreshDetail = async () => {
    const token = auth.token;
    const id = applicationId();
    if (!token || !id) {
      clearDetail();
      return;
    }

    const requestKey = `${token}:${id}`;
    if (activeDetailLoad && activeDetailLoadKey === requestKey) {
      return activeDetailLoad;
    }

    const isRefresh = loadedDetailKey() === requestKey;
    setEnvironmentsState(
      environments().length > 0 && isRefresh ? "refreshing" : "pending",
    );
    setEnvironmentsError(null);
    setApiKeysState(
      apiKeys().length > 0 && isRefresh ? "refreshing" : "pending",
    );
    setApiKeysError(null);
    setStructuresState(
      structures().length > 0 && isRefresh ? "refreshing" : "pending",
    );
    setStructuresError(null);

    activeDetailLoadKey = requestKey;
    activeDetailLoad = (async () => {
      try {
        const detail = await fetchApplicationDetail(id, token);
        setEnvironments(detail.environments);
        setEnvironmentsState("ready");
        setApiKeys(detail.apiKeys);
        setApiKeysState("ready");
        setStructures(detail.structures);
        setStructuresState("ready");
        setLoadedDetailKey(requestKey);
      } catch (error) {
        const err =
          error instanceof Error
            ? error
            : new Error("Failed to load application");
        setEnvironmentsError(err);
        setEnvironmentsState("errored");
        setApiKeysError(err);
        setApiKeysState("errored");
        setStructuresError(err);
        setStructuresState("errored");
      }
    })();

    try {
      await activeDetailLoad;
    } finally {
      activeDetailLoad = null;
      activeDetailLoadKey = null;
    }
  };

  const refreshApiKeys = refreshDetail;
  const refreshEnvironments = refreshDetail;
  const refreshStructures = refreshDetail;

  const refreshRpcs = async () => {
    const token = auth.token;
    const id = applicationId();
    if (!token || !id) {
      clearRpcs();
      return;
    }

    if (environmentsState() === "errored") {
      setRpcs([]);
      setRpcsState("errored");
      setRpcsError(
        environmentsError() ?? new Error("Failed to load environments"),
      );
      setLoadedRpcsKey(null);
      return;
    }

    if (environmentsState() !== "ready") {
      setRpcsState(rpcs().length > 0 ? "refreshing" : "pending");
      setRpcsError(null);
      return;
    }

    const availableEnvironments = environments();
    const requestKey = `${token}:${id}:${availableEnvironments
      .map((environment) => environment.id)
      .join("|")}`;
    if (activeRpcsLoad && activeRpcsLoadKey === requestKey) {
      return activeRpcsLoad;
    }

    const isRefresh = loadedRpcsKey() === requestKey;
    setRpcsState(rpcs().length > 0 && isRefresh ? "refreshing" : "pending");
    setRpcsError(null);

    if (availableEnvironments.length === 0) {
      setRpcs([]);
      setRpcsState("ready");
      setLoadedRpcsKey(requestKey);
      return;
    }

    activeRpcsLoadKey = requestKey;
    activeRpcsLoad = (async () => {
      try {
        const rpcGroups = await Promise.all(
          availableEnvironments.map((environment) =>
            fetchApplicationList<ApplicationRpc>(
              `/api/Applications/${id}/Rpcs/${encodeURIComponent(environment.id)}`,
              token,
              "Failed to load RPCs",
            ),
          ),
        );

        setRpcs(rpcGroups.flat());
        setRpcsState("ready");
        setLoadedRpcsKey(requestKey);
      } catch (error) {
        setRpcsError(
          error instanceof Error ? error : new Error("Failed to load RPCs"),
        );
        setRpcsState("errored");
      }
    })();

    try {
      await activeRpcsLoad;
    } finally {
      activeRpcsLoad = null;
      activeRpcsLoadKey = null;
    }
  };

  const refresh = async () => {
    await Promise.all([refreshDetail(), refreshRpcs()]);
  };

  const updateEnvironmentChains = async (
    environmentId: string,
    chains: string[],
  ) => {
    const token = auth.token;
    const id = applicationId();
    const environment = environments().find((item) => item.id === environmentId);
    if (!token || !id || !environment) {
      throw new Error("Environment not found");
    }

    const response = await fetch(
      `/api/Applications/${id}/Environments/${environmentId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: environment.name,
          chains,
        }),
      },
    );

    if (!response.ok) {
      throw new Error(
        await readErrorMessage(response, "Failed to update environment chains"),
      );
    }

    await refreshEnvironments();
  };

  const addEnvironmentChain = async (environmentId: string, chain: string) => {
    const environment = environments().find((item) => item.id === environmentId);
    if (!environment) {
      throw new Error("Environment not found");
    }
    if (environment.chains.includes(chain)) {
      return;
    }

    await updateEnvironmentChains(environmentId, [...environment.chains, chain]);
  };

  const removeEnvironmentChain = async (environmentId: string, chain: string) => {
    const environment = environments().find((item) => item.id === environmentId);
    if (!environment) {
      throw new Error("Environment not found");
    }
    if (!environment.chains.includes(chain)) {
      return;
    }

    await updateEnvironmentChains(
      environmentId,
      environment.chains.filter((item) => item !== chain),
    );
  };

  createEffect(() => {
    const token = auth.token;
    const id = applicationId();
    const envs = environments();
    const selected = selectedEnvironmentId();
    const detailKey = loadedDetailKey();

    if (!token || !id || detailKey !== `${token}:${id}`) {
      return;
    }

    if (envs.length > 0 && !envs.some((item) => item.id === selected)) {
      setSelectedEnvironmentId(envs[0].id);
      return;
    }

    if (envs.length === 0 && selected) {
      setSelectedEnvironmentId(undefined);
    }
  });

  createEffect(() => {
    const token = auth.token;
    const id = applicationId();

    if (!token || !id) {
      clear();
      return;
    }

    const requestKey = `${token}:${id}`;
    if (loadedDetailKey() !== requestKey) {
      void untrack(refreshDetail);
    }
  });

  createEffect(() => {
    const token = auth.token;
    const id = applicationId();
    const envState = environmentsState();
    const envError = environmentsError();
    const environmentIds = environments().map((environment) => environment.id);
    const currentRpcsKey = loadedRpcsKey();

    if (!token || !id) {
      clearRpcs();
      return;
    }

    if (envState === "errored") {
      setRpcs([]);
      setRpcsState("errored");
      setRpcsError(envError ?? new Error("Failed to load environments"));
      setLoadedRpcsKey(null);
      return;
    }

    if (envState !== "ready") {
      setRpcsError(null);

      // Keep already-loaded RPC data ready while environment details refresh.
      if (envState === "pending" || currentRpcsKey === null) {
        setRpcsState(rpcs().length > 0 ? "refreshing" : "pending");
      }

      return;
    }

    const requestKey = `${token}:${id}:${environmentIds.join("|")}`;
    if (loadedRpcsKey() !== requestKey) {
      void untrack(refreshRpcs);
      return;
    }

    // Detail refreshes can temporarily move environments out of `ready` without
    // invalidating the loaded RPC payload. Restore the settled RPC state when the
    // environment set is unchanged so the RPC tab does not get stuck loading.
    setRpcsError(null);
    setRpcsState("ready");
  });

  const rpcsByEnvironment = createMemo(() => {
    const grouped: Record<string, ApplicationRpc[]> = {};
    for (const rpc of rpcs()) {
      if (!grouped[rpc.environmentId]) {
        grouped[rpc.environmentId] = [];
      }
      grouped[rpc.environmentId].push(rpc);
    }
    return grouped;
  });

  const isApplicationDataInitializing = createMemo(() => {
    const token = auth.token;
    const id = applicationId();
    if (!token || !id) {
      return false;
    }
    return (
      environmentsState() === "pending" &&
      apiKeysState() === "pending" &&
      structuresState() === "pending"
    );
  });

  const value: ApplicationDataContextValue = {
    applicationId,
    environments: {
      data: environments,
      state: environmentsState,
      error: environmentsError,
    },
    selectedEnvironmentId,
    setSelectedEnvironmentId,
    apiKeys: {
      data: apiKeys,
      state: apiKeysState,
      error: apiKeysError,
    },
    rpcs: {
      data: rpcs,
      state: rpcsState,
      error: rpcsError,
    },
    rpcsByEnvironment,
    structures: {
      data: structures,
      state: structuresState,
      error: structuresError,
    },
    refreshDetail,
    refreshApiKeys,
    refreshEnvironments,
    refreshStructures,
    refreshRpcs,
    refresh,
    addEnvironmentChain,
    removeEnvironmentChain,
  };

  return (
    <ApplicationDataContext.Provider value={value}>
      <div class="flex min-h-0 flex-1 flex-col">
        <Show
          when={!isApplicationDataInitializing()}
          fallback={
            <div class="flex flex-1 flex-col items-center justify-center gap-3 py-24">
              <LoadingSpinner class="size-8 text-b-accent" />
            </div>
          }
        >
          {props.children}
        </Show>
      </div>
    </ApplicationDataContext.Provider>
  );
}

export function useApplicationData(): ApplicationDataContextValue {
  const context = useContext(ApplicationDataContext);
  if (!context) {
    throw new Error(
      "useApplicationData must be used within an ApplicationDataProvider",
    );
  }

  return context;
}
