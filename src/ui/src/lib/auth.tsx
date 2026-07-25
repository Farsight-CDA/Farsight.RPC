import {
  createContext,
  useContext,
  createSignal,
  type ParentComponent,
} from "solid-js";
import {
  isWebAuthnSupported,
  serializeAssertion,
  toRequestOptions,
  webAuthnErrorMessage,
  type AssertionOptionsJson,
} from "./webauthn";

export interface AuthState {
  token: string | null;
  username: string | null;
  expiresUtc: string | null;
}

export type LoginResult =
  | { kind: "success"; state: AuthState }
  | {
      kind: "requiresTwoFactor";
      challengeId: string;
      options: AssertionOptionsJson;
    };

interface AuthContextValue extends AuthState {
  login: (username: string, password: string) => Promise<LoginResult>;
  loginWithSecurityKey: (
    challengeId: string,
    options: AssertionOptionsJson,
  ) => Promise<AuthState>;
  logout: () => void;
  isAuthenticated: () => boolean;
}

const STORAGE_KEY = "farsight_rpc_auth";

const AuthContext = createContext<AuthContextValue>();

export function loadStoredAuth(): AuthState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as AuthState;
      if (parsed.expiresUtc && new Date(parsed.expiresUtc) > new Date()) {
        return parsed;
      }
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {}
  return { token: null, username: null, expiresUtc: null };
}

type AuthProviderProps = {
  initialState?: AuthState;
};

export const AuthProvider: ParentComponent<AuthProviderProps> = (props) => {
  const initial = props.initialState ?? loadStoredAuth();
  const [token, setToken] = createSignal(initial.token);
  const [username, setUsername] = createSignal(initial.username);
  const [expiresUtc, setExpiresUtc] = createSignal(initial.expiresUtc);

  const isAuthenticated = () => {
    const exp = expiresUtc();
    if (!token() || !exp) return false;
    if (new Date(exp) <= new Date()) {
      logout();
      return false;
    }
    return true;
  };

  const applyAuthState = (state: AuthState): AuthState => {
    setToken(state.token);
    setUsername(state.username);
    setExpiresUtc(state.expiresUtc);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return state;
  };

  const login = async (user: string, password: string): Promise<LoginResult> => {
    const response = await fetch("/api/Auth/Login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: user, password }),
    });

    if (!response.ok) {
      throw new Error(
        response.status === 401 ? "Invalid credentials" : "Login failed",
      );
    }

    const data = (await response.json()) as {
      token?: string;
      username: string;
      expiresUtc?: string;
      requiresTwoFactor: boolean;
      twoFactorChallengeId?: string;
      securityKeyOptions?: AssertionOptionsJson;
    };

    if (data.requiresTwoFactor) {
      if (!data.twoFactorChallengeId || !data.securityKeyOptions) {
        throw new Error("Login failed");
      }
      return {
        kind: "requiresTwoFactor",
        challengeId: data.twoFactorChallengeId,
        options: data.securityKeyOptions,
      };
    }

    if (!data.token || !data.expiresUtc) {
      throw new Error("Login failed");
    }

    const state = applyAuthState({
      token: data.token,
      username: data.username,
      expiresUtc: data.expiresUtc,
    });

    return { kind: "success", state };
  };

  const loginWithSecurityKey = async (
    challengeId: string,
    options: AssertionOptionsJson,
  ): Promise<AuthState> => {
    if (!isWebAuthnSupported()) {
      throw new Error("This browser does not support security keys.");
    }

    let credential: Credential | null;
    try {
      credential = await navigator.credentials.get({
        publicKey: toRequestOptions(options),
      });
    } catch (err) {
      throw new Error(
        webAuthnErrorMessage(err, "Security key verification failed"),
      );
    }

    if (!(credential instanceof PublicKeyCredential)) {
      throw new Error("Security key verification failed");
    }

    const response = await fetch("/api/Auth/Login/SecurityKey", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        challengeId,
        assertion: serializeAssertion(credential),
      }),
    });

    if (!response.ok) {
      throw new Error(
        response.status === 401
          ? "Security key verification failed"
          : "Login failed",
      );
    }

    const data = (await response.json()) as {
      token: string;
      username: string;
      expiresUtc: string;
    };

    return applyAuthState({
      token: data.token,
      username: data.username,
      expiresUtc: data.expiresUtc,
    });
  };

  const logout = () => {
    setToken(null);
    setUsername(null);
    setExpiresUtc(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const value: AuthContextValue = {
    get token() {
      return token();
    },
    get username() {
      return username();
    },
    get expiresUtc() {
      return expiresUtc();
    },
    login,
    loginWithSecurityKey,
    logout,
    isAuthenticated,
  };

  return (
    <AuthContext.Provider value={value}>{props.children}</AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
