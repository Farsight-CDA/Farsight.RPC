import { useParams } from "@solidjs/router";
import {
  createContext,
  createEffect,
  createMemo,
  createSignal,
  untrack,
  useContext,
  Show,
  type Accessor,
  type ParentProps,
} from "solid-js";
import LoadingSpinner from "../components/LoadingSpinner";
import { useAuth } from "./auth";
import { useReferenceData } from "./reference-data";

type LoadState = "idle" | "pending" | "refreshing" | "ready" | "errored";

export type ConsumerApiKeySummary = {
  id: string;
  environment: string;
  key: string;
};

export type ApplicationRpc = {
  id: string;
  type: "Realtime" | "Archive" | "Tracing";
  environment: string;
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
  apiKeys: ListController<ConsumerApiKeySummary>;
  rpcs: ListController<ApplicationRpc>;
  rpcsByEnvironment: Accessor<Record<string, ApplicationRpc[]>>;
  structures: ListController<string>;
  refreshDetail: () => Promise<void>;
  refreshApiKeys: () => Promise<void>;
  refreshStructures: () => Promise<void>;
  refreshRpcs: () => Promise<void>;
  refresh: () => Promise<void>;
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

export function ApplicationDataProvider(props: ParentProps) {
  const auth = useAuth();
  const referenceData = useReferenceData();
  const params = useParams();
  const applicationId = () => params.applicationId;

  const environments = referenceData.hostEnvironments.data;
  const environmentsState = referenceData.hostEnvironments.state;
  const environmentsError = referenceData.hostEnvironments.error;

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

  const clearDetail = () => {
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

    const envs = environments();
    const requestKey = `${token}:${id}:${envs.join("|")}`;
    if (activeRpcsLoad && activeRpcsLoadKey === requestKey) {
      return activeRpcsLoad;
    }

    const isRefresh = loadedRpcsKey() === requestKey;
    setRpcsState(rpcs().length > 0 && isRefresh ? "refreshing" : "pending");
    setRpcsError(null);

    activeRpcsLoadKey = requestKey;
    activeRpcsLoad = (async () => {
      try {
        const rpcGroups = await Promise.all(
          envs.map((environment) =>
            fetchApplicationList<ApplicationRpc>(
              `/api/Applications/${id}/Rpcs/${encodeURIComponent(environment)}`,
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
    const envs = environments();

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
      setRpcsState(rpcs().length > 0 ? "refreshing" : "pending");
      setRpcsError(null);
      return;
    }

    const requestKey = `${token}:${id}:${envs.join("|")}`;
    if (loadedRpcsKey() !== requestKey) {
      void untrack(refreshRpcs);
    }
  });

  const rpcsByEnvironment = createMemo(() => {
    const grouped: Record<string, ApplicationRpc[]> = {};
    for (const rpc of rpcs()) {
      if (!grouped[rpc.environment]) {
        grouped[rpc.environment] = [];
      }
      grouped[rpc.environment].push(rpc);
    }
    return grouped;
  });

  const isApplicationDataInitializing = createMemo(() => {
    const token = auth.token;
    const id = applicationId();
    if (!token || !id) {
      return false;
    }
    const detailPending =
      apiKeysState() === "pending" && apiKeys().length === 0;
    const rpcsPending =
      rpcsState() === "pending" && rpcs().length === 0;
    return detailPending || rpcsPending;
  });

  const value: ApplicationDataContextValue = {
    applicationId,
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
    refreshStructures,
    refreshRpcs,
    refresh,
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
