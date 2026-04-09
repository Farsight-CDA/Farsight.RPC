import { useParams } from "@solidjs/router";
import {
  createContext,
  createEffect,
  createMemo,
  createSignal,
  untrack,
  useContext,
  type Accessor,
  type ParentProps,
} from "solid-js";
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
  refreshApiKeys: () => Promise<void>;
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
  const [loadedApiKeysKey, setLoadedApiKeysKey] = createSignal<string | null>(null);

  const [rpcs, setRpcs] = createSignal<ApplicationRpc[]>([]);
  const [rpcsState, setRpcsState] = createSignal<LoadState>("idle");
  const [rpcsError, setRpcsError] = createSignal<Error | null>(null);
  const [loadedRpcsKey, setLoadedRpcsKey] = createSignal<string | null>(null);

  let activeApiKeysLoad: Promise<void> | null = null;
  let activeApiKeysLoadKey: string | null = null;
  let activeRpcsLoad: Promise<void> | null = null;
  let activeRpcsLoadKey: string | null = null;

  const clearApiKeys = () => {
    setApiKeys([]);
    setApiKeysState("idle");
    setApiKeysError(null);
    setLoadedApiKeysKey(null);
  };

  const clearRpcs = () => {
    setRpcs([]);
    setRpcsState("idle");
    setRpcsError(null);
    setLoadedRpcsKey(null);
  };

  const clear = () => {
    clearApiKeys();
    clearRpcs();
  };

  const refreshApiKeys = async () => {
    const token = auth.token;
    const id = applicationId();
    if (!token || !id) {
      clearApiKeys();
      return;
    }

    const requestKey = `${token}:${id}`;
    if (activeApiKeysLoad && activeApiKeysLoadKey === requestKey) {
      return activeApiKeysLoad;
    }

    const isRefresh = loadedApiKeysKey() === requestKey;
    setApiKeysState(apiKeys().length > 0 && isRefresh ? "refreshing" : "pending");
    setApiKeysError(null);

    activeApiKeysLoadKey = requestKey;
    activeApiKeysLoad = (async () => {
      try {
        const nextApiKeys = await fetchApplicationList<ConsumerApiKeySummary>(
          `/api/applications/${id}/api-keys`,
          token,
          "Failed to load API keys",
        );
        setApiKeys(nextApiKeys);
        setApiKeysState("ready");
        setLoadedApiKeysKey(requestKey);
      } catch (error) {
        setApiKeysError(
          error instanceof Error ? error : new Error("Failed to load API keys"),
        );
        setApiKeysState("errored");
      }
    })();

    try {
      await activeApiKeysLoad;
    } finally {
      activeApiKeysLoad = null;
      activeApiKeysLoadKey = null;
    }
  };

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
              `/api/applications/${id}/rpcs/${encodeURIComponent(environment)}`,
              token,
              "Failed to load RPCs",
            ),
          ),
        );

        setRpcs(rpcGroups.flat());
        setRpcsState("ready");
        setLoadedRpcsKey(requestKey);
      } catch (error) {
        setRpcsError(error instanceof Error ? error : new Error("Failed to load RPCs"));
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
    await Promise.all([refreshApiKeys(), refreshRpcs()]);
  };

  createEffect(() => {
    const token = auth.token;
    const id = applicationId();

    if (!token || !id) {
      clear();
      return;
    }

    const requestKey = `${token}:${id}`;
    if (loadedApiKeysKey() !== requestKey) {
      void untrack(refreshApiKeys);
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
    refreshApiKeys,
    refreshRpcs,
    refresh,
  };

  return (
    <ApplicationDataContext.Provider value={value}>
      {props.children}
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
