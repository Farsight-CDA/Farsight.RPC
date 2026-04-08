const STORAGE_KEY = "farsight.rpc.admin.token";
const EVENT_NAME = "farsight-rpc-auth-changed";

function notifyAuthChanged() {
  if(typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(EVENT_NAME));
  }
}

export function getToken() {
  if(typeof window === "undefined") {
    return "";
  }

  return window.localStorage.getItem(STORAGE_KEY) ?? "";
}

export function setToken(token: string) {
  if(typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, token);
  notifyAuthChanged();
}

export function clearToken() {
  if(typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEY);
  notifyAuthChanged();
}

export function isAuthenticated() {
  return getToken().length > 0;
}

export function subscribeToAuthChanges(callback: () => void) {
  if(typeof window === "undefined") {
    return () => undefined;
  }

  const handler = () => callback();
  window.addEventListener(EVENT_NAME, handler);
  return () => window.removeEventListener(EVENT_NAME, handler);
}
