import {
  createContext,
  createEffect,
  createMemo,
  createSignal,
  useContext,
  type Accessor,
  type ParentProps,
} from "solid-js";
import { useAuth } from "./auth";

type LoadState = "idle" | "pending" | "refreshing" | "ready" | "errored";

export type ApplicationSummary = {
  id: string;
  name: string;
  apiKeyCount: number;
  rpcCount: number;
};

export type RpcProviderSummary = {
  id: string;
  name: string;
  rateLimit: number;
  rpcCount: number;
};

export type RpcErrorGroupSummary = {
  id: string;
  name: string;
  action: string;
  errors: string[];
};

export type ReferenceDataSnapshot = {
  applications: ApplicationSummary[];
  rpcProviders: RpcProviderSummary[];
  chains: string[];
  errorGroups: RpcErrorGroupSummary[];
};

type ListController<T> = {
  data: Accessor<T[]>;
  state: Accessor<LoadState>;
  error: Accessor<Error | null>;
};

type ReferenceDataContextValue = {
  applications: ListController<ApplicationSummary>;
  rpcProviders: ListController<RpcProviderSummary>;
  chains: ListController<string>;
  errorGroups: ListController<RpcErrorGroupSummary>;
  isReferenceDataReady: Accessor<boolean>;
  load: (token?: string | null) => Promise<void>;
  refreshApplications: () => Promise<void>;
  refreshRpcProviders: () => Promise<void>;
  refreshErrorGroups: () => Promise<void>;
  removeApplication: (applicationId: string) => void;
};

const ReferenceDataContext = createContext<ReferenceDataContextValue>();

async function fetchReferenceList<T>(
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

export async function preloadReferenceData(
  token: string,
): Promise<ReferenceDataSnapshot> {
  const [applications, rpcProviders, chains, errorGroups] =
    await Promise.all([
      fetchReferenceList<ApplicationSummary>(
        "/api/Applications",
        token,
        "Failed to load applications",
      ),
      fetchReferenceList<RpcProviderSummary>(
        "/api/RpcProviders",
        token,
        "Failed to load RPC providers",
      ),
      fetchReferenceList<string>("/api/Chains", token, "Failed to load chains"),
      fetchReferenceList<RpcErrorGroupSummary>(
        "/api/RpcErrorGroups",
        token,
        "Failed to load error groups",
      ),
    ]);

  return {
    applications,
    rpcProviders,
    chains,
    errorGroups,
  };
}

type ReferenceDataProviderProps = ParentProps<{
  initialData?: ReferenceDataSnapshot;
  initialToken?: string | null;
}>;

export function ReferenceDataProvider(props: ReferenceDataProviderProps) {
  const auth = useAuth();
  const initialData = props.initialData;
  const [loadedToken, setLoadedToken] = createSignal(
    initialData && props.initialToken ? props.initialToken : null,
  );

  const [applications, setApplications] = createSignal(
    initialData?.applications ?? [],
  );
  const [applicationsState, setApplicationsState] = createSignal<LoadState>(
    initialData ? "ready" : "idle",
  );
  const [applicationsError, setApplicationsError] = createSignal<Error | null>(
    null,
  );

  const [rpcProviders, setRpcProviders] = createSignal(
    initialData?.rpcProviders ?? [],
  );
  const [rpcProvidersState, setRpcProvidersState] = createSignal<LoadState>(
    initialData ? "ready" : "idle",
  );
  const [rpcProvidersError, setRpcProvidersError] = createSignal<Error | null>(
    null,
  );

  const [chains, setChains] = createSignal(initialData?.chains ?? []);
  const [chainsState, setChainsState] = createSignal<LoadState>(
    initialData ? "ready" : "idle",
  );
  const [chainsError, setChainsError] = createSignal<Error | null>(null);

  const [errorGroups, setErrorGroups] = createSignal(
    initialData?.errorGroups ?? [],
  );
  const [errorGroupsState, setErrorGroupsState] = createSignal<LoadState>(
    initialData ? "ready" : "idle",
  );
  const [errorGroupsError, setErrorGroupsError] = createSignal<Error | null>(
    null,
  );

  let activeLoad: Promise<void> | null = null;
  let activeLoadToken: string | null = null;

  const clear = () => {
    setLoadedToken(null);
    setApplications([]);
    setApplicationsState("idle");
    setApplicationsError(null);
    setRpcProviders([]);
    setRpcProvidersState("idle");
    setRpcProvidersError(null);
    setChains([]);
    setChainsState("idle");
    setChainsError(null);
    setErrorGroups([]);
    setErrorGroupsState("idle");
    setErrorGroupsError(null);
  };

  const load = async (token = auth.token) => {
    if (!token) {
      clear();
      return;
    }

    if (activeLoad && activeLoadToken === token) {
      return activeLoad;
    }

    const isRefresh = loadedToken() === token;
    setApplicationsState(
      applications().length > 0 && isRefresh ? "refreshing" : "pending",
    );
    setApplicationsError(null);
    setRpcProvidersState(
      rpcProviders().length > 0 && isRefresh ? "refreshing" : "pending",
    );
    setRpcProvidersError(null);
    setChainsState(chains().length > 0 && isRefresh ? "refreshing" : "pending");
    setChainsError(null);
    setErrorGroupsState(
      errorGroups().length > 0 && isRefresh ? "refreshing" : "pending",
    );
    setErrorGroupsError(null);

    activeLoadToken = token;
    activeLoad = (async () => {
      const [
        applicationsResult,
        rpcProvidersResult,
        chainsResult,
        errorGroupsResult,
      ] = await Promise.allSettled([
        fetchReferenceList<ApplicationSummary>(
          "/api/Applications",
          token,
          "Failed to load applications",
        ),
        fetchReferenceList<RpcProviderSummary>(
          "/api/RpcProviders",
          token,
          "Failed to load RPC providers",
        ),
        fetchReferenceList<string>(
          "/api/Chains",
          token,
          "Failed to load chains",
        ),
        fetchReferenceList<RpcErrorGroupSummary>(
          "/api/RpcErrorGroups",
          token,
          "Failed to load error groups",
        ),
      ]);

      if (applicationsResult.status === "fulfilled") {
        setApplications(applicationsResult.value);
        setApplicationsState("ready");
      } else {
        setApplicationsError(
          applicationsResult.reason instanceof Error
            ? applicationsResult.reason
            : new Error("Failed to load applications"),
        );
        setApplicationsState("errored");
      }

      if (rpcProvidersResult.status === "fulfilled") {
        setRpcProviders(rpcProvidersResult.value);
        setRpcProvidersState("ready");
      } else {
        setRpcProvidersError(
          rpcProvidersResult.reason instanceof Error
            ? rpcProvidersResult.reason
            : new Error("Failed to load RPC providers"),
        );
        setRpcProvidersState("errored");
      }

      if (chainsResult.status === "fulfilled") {
        setChains(chainsResult.value);
        setChainsState("ready");
      } else {
        setChainsError(
          chainsResult.reason instanceof Error
            ? chainsResult.reason
            : new Error("Failed to load chains"),
        );
        setChainsState("errored");
      }

      if (errorGroupsResult.status === "fulfilled") {
        setErrorGroups(errorGroupsResult.value);
        setErrorGroupsState("ready");
      } else {
        setErrorGroupsError(
          errorGroupsResult.reason instanceof Error
            ? errorGroupsResult.reason
            : new Error("Failed to load error groups"),
        );
        setErrorGroupsState("errored");
      }

      setLoadedToken(token);
    })();

    try {
      await activeLoad;
    } finally {
      activeLoad = null;
      activeLoadToken = null;
    }
  };

  const refreshApplications = async () => {
    const token = auth.token;
    if (!token) {
      clear();
      return;
    }

    setApplicationsState(applications().length > 0 ? "refreshing" : "pending");
    setApplicationsError(null);

    try {
      const nextApplications = await fetchReferenceList<ApplicationSummary>(
        "/api/Applications",
        token,
        "Failed to load applications",
      );
      setApplications(nextApplications);
      setApplicationsState("ready");
      setLoadedToken(token);
    } catch (error) {
      setApplicationsError(
        error instanceof Error
          ? error
          : new Error("Failed to load applications"),
      );
      setApplicationsState("errored");
    }
  };

  const refreshRpcProviders = async () => {
    const token = auth.token;
    if (!token) {
      clear();
      return;
    }

    setRpcProvidersState(rpcProviders().length > 0 ? "refreshing" : "pending");
    setRpcProvidersError(null);

    try {
      const next = await fetchReferenceList<RpcProviderSummary>(
        "/api/RpcProviders",
        token,
        "Failed to load RPC providers",
      );
      setRpcProviders(next);
      setRpcProvidersState("ready");
      setLoadedToken(token);
    } catch (error) {
      setRpcProvidersError(
        error instanceof Error
          ? error
          : new Error("Failed to load RPC providers"),
      );
      setRpcProvidersState("errored");
    }
  };

  const refreshErrorGroups = async () => {
    const token = auth.token;
    if (!token) {
      clear();
      return;
    }

    setErrorGroupsState(errorGroups().length > 0 ? "refreshing" : "pending");
    setErrorGroupsError(null);

    try {
      const next = await fetchReferenceList<RpcErrorGroupSummary>(
        "/api/RpcErrorGroups",
        token,
        "Failed to load error groups",
      );
      setErrorGroups(next);
      setErrorGroupsState("ready");
      setLoadedToken(token);
    } catch (error) {
      setErrorGroupsError(
        error instanceof Error
          ? error
          : new Error("Failed to load error groups"),
      );
      setErrorGroupsState("errored");
    }
  };

  const removeApplication = (applicationId: string) => {
    setApplications((current) =>
      current.filter((app) => app.id !== applicationId),
    );
    setApplicationsError(null);
    setApplicationsState("ready");
  };

  createEffect(() => {
    const token = auth.token;
    if (!token) {
      clear();
      return;
    }

    if (loadedToken() !== token) {
      void load(token);
    }
  });

  const isReferenceDataReady = createMemo(() => {
    const token = auth.token;
    if (!token) {
      return true;
    }
    return loadedToken() === token;
  });

  const value: ReferenceDataContextValue = {
    applications: {
      data: applications,
      state: applicationsState,
      error: applicationsError,
    },
    rpcProviders: {
      data: rpcProviders,
      state: rpcProvidersState,
      error: rpcProvidersError,
    },
    chains: {
      data: chains,
      state: chainsState,
      error: chainsError,
    },
    errorGroups: {
      data: errorGroups,
      state: errorGroupsState,
      error: errorGroupsError,
    },
    isReferenceDataReady,
    load,
    refreshApplications,
    refreshRpcProviders,
    refreshErrorGroups,
    removeApplication,
  };

  return (
    <ReferenceDataContext.Provider value={value}>
      {props.children}
    </ReferenceDataContext.Provider>
  );
}

export function useReferenceData(): ReferenceDataContextValue {
  const context = useContext(ReferenceDataContext);
  if (!context) {
    throw new Error(
      "useReferenceData must be used within a ReferenceDataProvider",
    );
  }

  return context;
}
