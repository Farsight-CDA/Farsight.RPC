import { useParams } from "@solidjs/router";
import {
  createContext,
  createEffect,
  createSignal,
  untrack,
  useContext,
  type Accessor,
  type ParentProps,
} from "solid-js";
import { useAuth } from "./auth";

type LoadState = "idle" | "pending" | "refreshing" | "ready" | "errored";

export type WalletApiKeySummary = {
  id: string;
  name: string;
  lastUsedAt?: string;
};

export type WalletPrivateKeySummary = {
  id: string;
  curve: string;
  derivationPath: string;
  addressFormat: "Evm" | "Solana" | "Cosmos";
  address: string;
  publicKey: string;
  apiKeys: WalletApiKeySummary[];
};

type WalletDetail = {
  id: string;
  name: string;
  color: string;
  privateKeys: WalletPrivateKeySummary[];
};

type ListController<T> = {
  data: Accessor<T[]>;
  state: Accessor<LoadState>;
  error: Accessor<Error | null>;
};

type WalletDataContextValue = {
  walletId: Accessor<string | undefined>;
  privateKeys: ListController<WalletPrivateKeySummary>;
  refresh: () => Promise<void>;
  addPrivateKey: (privateKey: WalletPrivateKeySummary) => void;
  removePrivateKey: (privateKeyId: string) => void;
  addApiKey: (privateKeyId: string, apiKey: WalletApiKeySummary) => void;
  renameApiKey: (privateKeyId: string, apiKeyId: string, name: string) => void;
  removeApiKey: (privateKeyId: string, apiKeyId: string) => void;
};

const WalletDataContext = createContext<WalletDataContextValue>();

async function fetchWalletDetail(id: string, token: string): Promise<WalletDetail> {
  const response = await fetch(`/api/Wallets/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error("Failed to load wallet");
  }

  return response.json() as Promise<WalletDetail>;
}

export function WalletDataProvider(props: ParentProps) {
  const auth = useAuth();
  const params = useParams();
  const walletId = () => params.walletId;

  const [privateKeys, setPrivateKeys] = createSignal<WalletPrivateKeySummary[]>(
    [],
  );
  const [privateKeysState, setPrivateKeysState] =
    createSignal<LoadState>("idle");
  const [privateKeysError, setPrivateKeysError] = createSignal<Error | null>(
    null,
  );
  const [loadedKey, setLoadedKey] = createSignal<string | null>(null);
  let activeLoad: Promise<void> | null = null;
  let activeLoadKey: string | null = null;

  const clear = () => {
    setPrivateKeys([]);
    setPrivateKeysState("idle");
    setPrivateKeysError(null);
    setLoadedKey(null);
  };

  const refresh = async () => {
    const token = auth.token;
    const id = walletId();
    if (!token || !id) {
      clear();
      return;
    }

    const requestKey = `${token}:${id}`;
    if (activeLoad && activeLoadKey === requestKey) {
      return activeLoad;
    }

    const isRefresh = loadedKey() === requestKey;
    setPrivateKeysState(
      privateKeys().length > 0 && isRefresh ? "refreshing" : "pending",
    );
    setPrivateKeysError(null);
    activeLoadKey = requestKey;
    activeLoad = (async () => {
      try {
        const detail = await fetchWalletDetail(id, token);
        setPrivateKeys(detail.privateKeys);
        setPrivateKeysState("ready");
        setLoadedKey(requestKey);
      } catch (error) {
        setPrivateKeysError(
          error instanceof Error ? error : new Error("Failed to load wallet"),
        );
        setPrivateKeysState("errored");
      }
    })();

    try {
      await activeLoad;
    } finally {
      activeLoad = null;
      activeLoadKey = null;
    }
  };

  createEffect(() => {
    const token = auth.token;
    const id = walletId();
    if (!token || !id) {
      clear();
      return;
    }

    const requestKey = `${token}:${id}`;
    if (loadedKey() !== requestKey) {
      void untrack(refresh);
    }
  });

  const addPrivateKey = (privateKey: WalletPrivateKeySummary) => {
    setPrivateKeys((current) => [...current, privateKey]);
    setPrivateKeysError(null);
    setPrivateKeysState("ready");
  };

  const removePrivateKey = (privateKeyId: string) => {
    setPrivateKeys((current) =>
      current.filter((privateKey) => privateKey.id !== privateKeyId),
    );
    setPrivateKeysError(null);
    setPrivateKeysState("ready");
  };

  const addApiKey = (privateKeyId: string, apiKey: WalletApiKeySummary) => {
    setPrivateKeys((current) =>
      current.map((privateKey) =>
        privateKey.id === privateKeyId
          ? { ...privateKey, apiKeys: [...privateKey.apiKeys, apiKey] }
          : privateKey,
      ),
    );
    setPrivateKeysError(null);
    setPrivateKeysState("ready");
  };

  const renameApiKey = (
    privateKeyId: string,
    apiKeyId: string,
    name: string,
  ) => {
    setPrivateKeys((current) =>
      current.map((privateKey) =>
        privateKey.id === privateKeyId
          ? {
              ...privateKey,
              apiKeys: privateKey.apiKeys.map((apiKey) =>
                apiKey.id === apiKeyId ? { ...apiKey, name } : apiKey,
              ),
            }
          : privateKey,
      ),
    );
    setPrivateKeysError(null);
    setPrivateKeysState("ready");
  };

  const removeApiKey = (privateKeyId: string, apiKeyId: string) => {
    setPrivateKeys((current) =>
      current.map((privateKey) =>
        privateKey.id === privateKeyId
          ? {
              ...privateKey,
              apiKeys: privateKey.apiKeys.filter(
                (apiKey) => apiKey.id !== apiKeyId,
              ),
            }
          : privateKey,
      ),
    );
    setPrivateKeysError(null);
    setPrivateKeysState("ready");
  };

  const value: WalletDataContextValue = {
    walletId,
    privateKeys: {
      data: privateKeys,
      state: privateKeysState,
      error: privateKeysError,
    },
    refresh,
    addPrivateKey,
    removePrivateKey,
    addApiKey,
    renameApiKey,
    removeApiKey,
  };

  return (
    <WalletDataContext.Provider value={value}>
      {props.children}
    </WalletDataContext.Provider>
  );
}

export function useWalletData(): WalletDataContextValue {
  const context = useContext(WalletDataContext);
  if (!context) {
    throw new Error("useWalletData must be used within a WalletDataProvider");
  }

  return context;
}
