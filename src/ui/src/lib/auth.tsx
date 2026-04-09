import { createContext, useContext, createSignal, type ParentComponent } from "solid-js";

interface AuthState {
  token: string | null;
  username: string | null;
  expiresUtc: string | null;
}

interface AuthContextValue extends AuthState {
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: () => boolean;
}

const STORAGE_KEY = "farsight_rpc_auth";

const AuthContext = createContext<AuthContextValue>();

function loadStoredAuth(): AuthState {
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

export const AuthProvider: ParentComponent = (props) => {
  const initial = loadStoredAuth();
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

  const login = async (user: string, password: string) => {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: user, password }),
    });

    if (!response.ok) {
      throw new Error(response.status === 401 ? "Invalid credentials" : "Login failed");
    }

    const data = await response.json() as { token: string; username: string; expiresUtc: string };
    const state: AuthState = {
      token: data.token,
      username: data.username,
      expiresUtc: data.expiresUtc,
    };

    setToken(state.token);
    setUsername(state.username);
    setExpiresUtc(state.expiresUtc);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  };

  const logout = () => {
    setToken(null);
    setUsername(null);
    setExpiresUtc(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const value: AuthContextValue = {
    get token() { return token(); },
    get username() { return username(); },
    get expiresUtc() { return expiresUtc(); },
    login,
    logout,
    isAuthenticated,
  };

  return <AuthContext.Provider value={value}>{props.children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}