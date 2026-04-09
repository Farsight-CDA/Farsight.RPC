import {
  createContext,
  createEffect,
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

export type ReferenceDataSnapshot = {
  applications: ApplicationSummary[];
  rpcProviders: RpcProviderSummary[];
  chains: string[];
  hostEnvironments: string[];
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
  hostEnvironments: ListController<string>;
  load: (token?: string | null) => Promise<void>;
  refreshApplications: () => Promise<void>;
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
  const [applications, rpcProviders, chains, hostEnvironments] =
    await Promise.all([
      fetchReferenceList<ApplicationSummary>(
        "/api/applications",
        token,
        "Failed to load applications",
      ),
      fetchReferenceList<RpcProviderSummary>(
        "/api/rpc-providers",
        token,
        "Failed to load RPC providers",
      ),
      fetchReferenceList<string>("/api/chains", token, "Failed to load chains"),
      fetchReferenceList<string>(
        "/api/host-environments",
        token,
        "Failed to load environments",
      ),
    ]);

  return {
    applications,
    rpcProviders,
    chains,
    hostEnvironments,
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

  const [hostEnvironments, setHostEnvironments] = createSignal(
    initialData?.hostEnvironments ?? [],
  );
  const [hostEnvironmentsState, setHostEnvironmentsState] =
    createSignal<LoadState>(initialData ? "ready" : "idle");
  const [hostEnvironmentsError, setHostEnvironmentsError] = createSignal<
    Error | null
  >(null);

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
    setHostEnvironments([]);
    setHostEnvironmentsState("idle");
    setHostEnvironmentsError(null);
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
    setHostEnvironmentsState(
      hostEnvironments().length > 0 && isRefresh ? "refreshing" : "pending",
    );
    setHostEnvironmentsError(null);

    activeLoadToken = token;
    activeLoad = (async () => {
      const [applicationsResult, rpcProvidersResult, chainsResult, hostEnvironmentsResult] =
        await Promise.allSettled([
          fetchReferenceList<ApplicationSummary>(
            "/api/applications",
            token,
            "Failed to load applications",
          ),
          fetchReferenceList<RpcProviderSummary>(
            "/api/rpc-providers",
            token,
            "Failed to load RPC providers",
          ),
          fetchReferenceList<string>(
            "/api/chains",
            token,
            "Failed to load chains",
          ),
          fetchReferenceList<string>(
            "/api/host-environments",
            token,
            "Failed to load environments",
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

      if (hostEnvironmentsResult.status === "fulfilled") {
        setHostEnvironments(hostEnvironmentsResult.value);
        setHostEnvironmentsState("ready");
      } else {
        setHostEnvironmentsError(
          hostEnvironmentsResult.reason instanceof Error
            ? hostEnvironmentsResult.reason
            : new Error("Failed to load environments"),
        );
        setHostEnvironmentsState("errored");
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
        "/api/applications",
        token,
        "Failed to load applications",
      );
      setApplications(nextApplications);
      setApplicationsState("ready");
      setLoadedToken(token);
    } catch (error) {
      setApplicationsError(
        error instanceof Error ? error : new Error("Failed to load applications"),
      );
      setApplicationsState("errored");
    }
  };

  const removeApplication = (applicationId: string) => {
    setApplications((current) => current.filter((app) => app.id !== applicationId));
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
    hostEnvironments: {
      data: hostEnvironments,
      state: hostEnvironmentsState,
      error: hostEnvironmentsError,
    },
    load,
    refreshApplications,
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
