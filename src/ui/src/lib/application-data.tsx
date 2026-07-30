import { useParams, useSearchParams } from "@solidjs/router";
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
  enablePublicRpcs: boolean;
};

export type ConsumerApiKeySummary = {
  id: string;
  environmentId: string;
  name: string;
  key: string;
  lastUsedAt?: string;
};

export type ApplicationRpcRule = {
  id: string;
  environmentId: string;
  allOf: string[];
  anyOf: string[];
};

export type ApplicationRpc = {
  id: string;
  environmentId: string;
  chain: string;
  address: string;
  providerId: string;
  applicationId: string;
  capabilities: string[];
  ethGetLogsLimit: number;
  order: number;
};

export type PublicRpc = {
  chain: string;
  address: string;
};

type ApplicationDetail = {
  id: string;
  name: string;
  environments: ApplicationEnvironmentSummary[];
  apiKeys: ConsumerApiKeySummary[];
  color: string;
  rules: ApplicationRpcRule[];
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
  rules: ListController<ApplicationRpcRule>;
  rpcs: ListController<ApplicationRpc>;
  publicRpcs: ListController<PublicRpc>;
  rpcsByEnvironment: Accessor<Record<string, ApplicationRpc[]>>;
  refreshApplication: () => Promise<void>;
  refreshRpcs: () => Promise<void>;
  refresh: () => Promise<void>;
  addEnvironmentChain: (environmentId: string, chain: string) => Promise<void>;
  removeEnvironmentChain: (
    environmentId: string,
    chain: string,
  ) => Promise<void>;
  updateEnvironmentSettings: (
    environmentId: string,
    settings: { enablePublicRpcs: boolean },
  ) => Promise<void>;
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
  const [searchParams, setSearchParams] = useSearchParams();
  const applicationId = () => params.applicationId;

  const requestedEnvironmentId = () => {
    const value = searchParams.environment;
    return Array.isArray(value) ? value[0] : value;
  };

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

  const [rules, setRules] = createSignal<ApplicationRpcRule[]>([]);
  const [rulesState, setRulesState] = createSignal<LoadState>("idle");
  const [rulesError, setRulesError] = createSignal<Error | null>(null);

  const [loadedDetailKey, setLoadedDetailKey] = createSignal<string | null>(
    null,
  );
  let activeDetailLoad: Promise<void> | null = null;
  let activeDetailLoadKey: string | null = null;

  const [rpcs, setRpcs] = createSignal<ApplicationRpc[]>([]);
  const [rpcsState, setRpcsState] = createSignal<LoadState>("idle");
  const [rpcsError, setRpcsError] = createSignal<Error | null>(null);
  const [loadedRpcsKey, setLoadedRpcsKey] = createSignal<string | null>(null);
  let activeRpcsLoad: Promise<void> | null = null;
  let activeRpcsLoadKey: string | null = null;

  const [publicRpcs, setPublicRpcs] = createSignal<PublicRpc[]>([]);
  const [publicRpcsState, setPublicRpcsState] = createSignal<LoadState>("idle");
  const [publicRpcsError, setPublicRpcsError] = createSignal<Error | null>(
    null,
  );

  const selectedEnvironmentId = createMemo(() => {
    const availableEnvironments = environments();
    const requested = requestedEnvironmentId();
    return (
      availableEnvironments.find((item) => item.id === requested)?.id ??
      availableEnvironments[0]?.id
    );
  });

  const setSelectedEnvironmentId = ((value) => {
    const next =
      typeof value === "function" ? value(selectedEnvironmentId()) : value;
    setSearchParams({ environment: next });
    return next;
  }) as Setter<string | undefined>;

  const clearDetail = () => {
    setSelectedEnvironmentId(undefined);
    setEnvironments([]);
    setEnvironmentsState("idle");
    setEnvironmentsError(null);
    setApiKeys([]);
    setApiKeysState("idle");
    setApiKeysError(null);
    setRules([]);
    setRulesState("idle");
    setRulesError(null);
    setLoadedDetailKey(null);
  };

  const clearRpcs = () => {
    setRpcs([]);
    setRpcsState("idle");
    setRpcsError(null);
    setLoadedRpcsKey(null);
    setPublicRpcs([]);
    setPublicRpcsState("idle");
    setPublicRpcsError(null);
  };

  const clear = () => {
    clearDetail();
    clearRpcs();
  };

  const refreshApplication = async () => {
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
    setRulesState(rules().length > 0 && isRefresh ? "refreshing" : "pending");
    setRulesError(null);
    activeDetailLoadKey = requestKey;
    activeDetailLoad = (async () => {
      try {
        const detail = await fetchApplicationDetail(id, token);
        setEnvironments(detail.environments);
        setEnvironmentsState("ready");
        setApiKeys(detail.apiKeys);
        setApiKeysState("ready");
        setRules(detail.rules);
        setRulesState("ready");
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
        setRulesError(err);
        setRulesState("errored");
      }
    })();

    try {
      await activeDetailLoad;
    } finally {
      activeDetailLoad = null;
      activeDetailLoadKey = null;
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
      setPublicRpcs([]);
      setPublicRpcsState("errored");
      setPublicRpcsError(
        environmentsError() ?? new Error("Failed to load environments"),
      );
      return;
    }

    if (environmentsState() !== "ready") {
      setRpcsState(rpcs().length > 0 ? "refreshing" : "pending");
      setRpcsError(null);
      setPublicRpcsState(publicRpcs().length > 0 ? "refreshing" : "pending");
      setPublicRpcsError(null);
      return;
    }

    const availableEnvironments = environments();
    const requestKey = `${token}:${id}:${availableEnvironments
      .map((environment) => `${environment.id}:${environment.enablePublicRpcs}`)
      .join("|")}`;
    if (activeRpcsLoad && activeRpcsLoadKey === requestKey) {
      return activeRpcsLoad;
    }

    const isRefresh = loadedRpcsKey() === requestKey;
    setRpcsState(rpcs().length > 0 && isRefresh ? "refreshing" : "pending");
    setRpcsError(null);
    setPublicRpcsState(
      publicRpcs().length > 0 && isRefresh ? "refreshing" : "pending",
    );
    setPublicRpcsError(null);

    if (availableEnvironments.length === 0) {
      setRpcs([]);
      setRpcsState("ready");
      setPublicRpcs([]);
      setPublicRpcsState("ready");
      setLoadedRpcsKey(requestKey);
      return;
    }

    activeRpcsLoadKey = requestKey;
    activeRpcsLoad = (async () => {
      try {
        const results = await Promise.all(
          availableEnvironments.map((environment) =>
            fetch(
              `/api/Applications/${id}/Rpcs/${encodeURIComponent(environment.id)}`,
              { headers: { Authorization: `Bearer ${token}` } },
            ).then(async (response) => {
              if (!response.ok) {
                throw new Error("Failed to load RPCs");
              }
              const data = (await response.json()) as {
                rpcs: ApplicationRpc[];
                publicRpcs: PublicRpc[];
              };
              return {
                environmentId: environment.id,
                rpcs: data.rpcs.map((rpc) => ({
                  ...rpc,
                  environmentId: environment.id,
                  applicationId: id,
                })),
                publicRpcs: data.publicRpcs,
              };
            }),
          ),
        );

        setRpcs(results.flatMap((group) => group.rpcs));
        setRpcsState("ready");
        setPublicRpcs(results.flatMap((group) => group.publicRpcs));
        setPublicRpcsState("ready");
        setLoadedRpcsKey(requestKey);
      } catch (error) {
        const err =
          error instanceof Error ? error : new Error("Failed to load RPCs");
        setRpcsError(err);
        setRpcsState("errored");
        setPublicRpcsError(err);
        setPublicRpcsState("errored");
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
    await Promise.all([refreshApplication(), refreshRpcs()]);
  };

  const updateEnvironmentChains = async (
    environmentId: string,
    chains: string[],
  ) => {
    const token = auth.token;
    const id = applicationId();
    const environment = environments().find(
      (item) => item.id === environmentId,
    );
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

    await refreshApplication();
  };

  const addEnvironmentChain = async (environmentId: string, chain: string) => {
    const environment = environments().find(
      (item) => item.id === environmentId,
    );
    if (!environment) {
      throw new Error("Environment not found");
    }
    if (environment.chains.includes(chain)) {
      return;
    }

    await updateEnvironmentChains(environmentId, [
      ...environment.chains,
      chain,
    ]);
  };

  const removeEnvironmentChain = async (
    environmentId: string,
    chain: string,
  ) => {
    const environment = environments().find(
      (item) => item.id === environmentId,
    );
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

  const updateEnvironmentSettings = async (
    environmentId: string,
    settings: { enablePublicRpcs: boolean },
  ) => {
    const token = auth.token;
    const id = applicationId();
    const environment = environments().find(
      (item) => item.id === environmentId,
    );
    if (!token || !id || !environment) {
      throw new Error("Environment not found");
    }

    const response = await fetch(
      `/api/Applications/${id}/Environments/${environmentId}/PublicRpcs`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          enablePublicRpcs: settings.enablePublicRpcs,
        }),
      },
    );

    if (!response.ok) {
      throw new Error(
        await readErrorMessage(response, "Failed to update environment"),
      );
    }

    setEnvironments((items) =>
      items.map((item) =>
        item.id === environmentId
          ? { ...item, enablePublicRpcs: settings.enablePublicRpcs }
          : item,
      ),
    );

    await refreshRpcs();
  };

  createEffect(() => {
    const token = auth.token;
    const id = applicationId();
    const selected = selectedEnvironmentId();
    const detailKey = loadedDetailKey();

    if (!token || !id || detailKey !== `${token}:${id}`) {
      return;
    }

    if (requestedEnvironmentId() !== selected) {
      setSearchParams({ environment: selected }, { replace: true });
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
      void untrack(refreshApplication);
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
      setPublicRpcs([]);
      setPublicRpcsState("errored");
      setPublicRpcsError(envError ?? new Error("Failed to load environments"));
      return;
    }

    if (envState !== "ready") {
      setRpcsError(null);
      setPublicRpcsError(null);

      // Keep already-loaded RPC data ready while environment details refresh.
      if (envState === "pending" || currentRpcsKey === null) {
        setRpcsState(rpcs().length > 0 ? "refreshing" : "pending");
        setPublicRpcsState(
          publicRpcs().length > 0 ? "refreshing" : "pending",
        );
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
    setPublicRpcsError(null);
    setPublicRpcsState("ready");
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
      rulesState() === "pending"
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
    rules: {
      data: rules,
      state: rulesState,
      error: rulesError,
    },
    rpcs: {
      data: rpcs,
      state: rpcsState,
      error: rpcsError,
    },
    publicRpcs: {
      data: publicRpcs,
      state: publicRpcsState,
      error: publicRpcsError,
    },
    rpcsByEnvironment,
    refreshApplication,
    refreshRpcs,
    refresh,
    addEnvironmentChain,
    removeEnvironmentChain,
    updateEnvironmentSettings,
  };

  return (
    <ApplicationDataContext.Provider value={value}>
      <div class="flex min-h-0 flex-1 flex-col overflow-hidden">
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
