export type RpcType = "Realtime" | "Archive" | "Tracing";
export type TracingMode = "Debug" | "Trace";
export type RpcErrorAction = "Transient" | "SoftOverwhelmed" | "HardOverwhelmed";

export interface RpcProvider {
  id: string;
  name: string;
  rateLimit: number;
}

export interface RpcErrorGroup {
  id: string;
  name: string;
  action: RpcErrorAction;
  errors: string[];
}

export interface RpcEndpointBase {
  id: string;
  address: string;
  providerId: string;
}

export interface RealtimeRpcEndpoint extends RpcEndpointBase {
  type: "Realtime";
}

export interface ArchiveRpcEndpoint extends RpcEndpointBase {
  type: "Archive";
  indexerStepSize: number;
  indexerBlockOffset: number;
}

export interface TracingRpcEndpoint extends RpcEndpointBase {
  type: "Tracing";
  tracingMode: TracingMode;
}

export type RpcEndpoint = RealtimeRpcEndpoint | ArchiveRpcEndpoint | TracingRpcEndpoint;

export interface GetRpcsSuccessResult {
  kind: "success";
  rpcs: Record<string, RpcEndpoint[]>;
  providers: RpcProvider[];
  errorGroups: RpcErrorGroup[];
}

export interface GetRpcsInvalidApiKeyResult {
  kind: "invalid-api-key";
}

export type GetRpcsResult = GetRpcsSuccessResult | GetRpcsInvalidApiKeyResult;

export type FetchLike = (input: string | URL, init?: RequestInit) => Promise<Response>;

export interface FarsightRpcClientOptions {
  apiUrl?: string | URL;
  apiKey?: string | null | undefined;
  fetch?: FetchLike;
}

export interface GetRpcsOptions {
  signal?: AbortSignal;
}
