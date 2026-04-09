import { clearToken, getToken } from "./auth";
import type {
  AdminLoginResponse,
  ApiClientCreateResult,
  ApiClientListItem,
  HostEnvironment,
  LookupItem,
  ProviderEditModel,
  ProviderListItem,
  ProviderRateLimitRow,
  RpcEndpointType,
} from "./types";

async function parseError(response: Response) {
  try {
    const payload = await response.json();
    return payload.message ?? payload.Message ?? `${response.status} ${response.statusText}`;
  }
  catch {
    return `${response.status} ${response.statusText}`;
  }
}

async function apiFetch<T>(path: string, init: RequestInit = {}, authenticated = true): Promise<T> {
  const headers = new Headers(init.headers);
  if(init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if(authenticated) {
    const token = getToken();
    if(token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  const response = await fetch(path, { ...init, headers });
  if(response.status === 401) {
    clearToken();
    if(typeof window !== "undefined") {
      window.location.href = "/login";
    }
    throw new Error("Your session has expired.");
  }

  if(!response.ok) {
    throw new Error(await parseError(response));
  }

  if(response.status === 204) {
    return undefined as T;
  }

  return await response.json() as T;
}

export const login = (userName: string, password: string) => apiFetch<AdminLoginResponse>("/api/admin/auth/login", {
  method: "POST",
  body: JSON.stringify({ userName, password }),
}, false);

export const getApplications = () => apiFetch<LookupItem[]>("/api/admin/applications");
export const createApplication = (name: string) => apiFetch<void>("/api/admin/applications", { method: "POST", body: JSON.stringify({ name }) });
export const deleteApplication = (id: string) => apiFetch<void>(`/api/admin/applications/${id}`, { method: "DELETE" });

export const getChains = () => apiFetch<LookupItem[]>("/api/admin/chains");
export const createChain = (name: string) => apiFetch<void>("/api/admin/chains", { method: "POST", body: JSON.stringify({ name }) });
export const deleteChain = (id: string) => apiFetch<void>(`/api/admin/chains/${id}`, { method: "DELETE" });

export const getProviders = () => apiFetch<ProviderRateLimitRow[]>("/api/admin/providers");
export const createProvider = (name: string, rateLimit: number) => apiFetch<void>("/api/admin/providers", {
  method: "POST",
  body: JSON.stringify({ name, rateLimit }),
});
export const deleteProvider = (id: string) => apiFetch<void>(`/api/admin/providers/${id}`, { method: "DELETE" });
export const saveProviderRateLimit = (id: string, rateLimit: number) => apiFetch<void>(`/api/admin/providers/${id}/rate-limit`, {
  method: "PUT",
  body: JSON.stringify({ id, rateLimit }),
});

export const getEndpoints = (query: { applicationId?: string; chainId?: string; environment: HostEnvironment }) => {
  const params = new URLSearchParams({ environment: query.environment });
  if(query.applicationId) {
    params.set("applicationId", query.applicationId);
  }
  if(query.chainId) {
    params.set("chainId", query.chainId);
  }
  return apiFetch<ProviderListItem[]>(`/api/admin/endpoints?${params.toString()}`);
};
export const getEndpoint = (type: RpcEndpointType, id: string) => apiFetch<ProviderEditModel>(`/api/admin/endpoints/${type}/${id}`);
export const createEndpoint = (model: ProviderEditModel) => apiFetch<void>("/api/admin/endpoints", { method: "POST", body: JSON.stringify(model) });
export const updateEndpoint = (model: ProviderEditModel) => apiFetch<void>("/api/admin/endpoints", { method: "PUT", body: JSON.stringify(model) });
export const deleteEndpoint = (type: RpcEndpointType, id: string) => apiFetch<void>(`/api/admin/endpoints/${type}/${id}`, { method: "DELETE" });

export const getApiKeys = () => apiFetch<ApiClientListItem[]>("/api/admin/api-keys");
export const createApiKey = (applicationId: string, environment: HostEnvironment) => apiFetch<ApiClientCreateResult>("/api/admin/api-keys", {
  method: "POST",
  body: JSON.stringify({ applicationId, environment }),
});
export const toggleApiKey = (id: string) => apiFetch<void>(`/api/admin/api-keys/${id}/toggle`, { method: "POST" });

export const getEnvironmentLookups = () => apiFetch<string[]>("/api/admin/lookups/environments");
export const getEndpointTypeLookups = () => apiFetch<string[]>("/api/admin/lookups/endpoint-types");
export const getTracingModeLookups = () => apiFetch<string[]>("/api/admin/lookups/tracing-modes");
