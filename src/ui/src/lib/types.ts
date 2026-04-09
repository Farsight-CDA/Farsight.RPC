export type HostEnvironment = string;
export type RpcEndpointType = string;
export type TracingMode = string;

export interface LookupItem {
  id: string;
  name: string;
}

export interface ProviderListItem {
  id: string;
  type: RpcEndpointType;
  environment: HostEnvironment;
  application: string;
  chain: string;
  provider: string;
  address: string;
  indexerStepSize: number | null;
  dexIndexStepSize: number | null;
  indexBlockOffset: number | null;
  tracingMode: TracingMode | null;
  updatedUtc: string;
}

export interface ProviderEditModel {
  id?: string;
  type: RpcEndpointType;
  environment: HostEnvironment;
  applicationId: string;
  chainId: string;
  providerId: string;
  address: string;
  indexerStepSize: number | null;
  dexIndexStepSize: number | null;
  indexBlockOffset: number | null;
  tracingMode: TracingMode;
}

export interface ApiClientListItem {
  id: string;
  apiKey: string;
  applicationId: string | null;
  application: string | null;
  environment: HostEnvironment | null;
  isEnabled: boolean;
  createdUtc: string;
  updatedUtc: string;
}

export interface ApiClientCreateResult {
  id: string;
  apiKey: string;
}

export interface ProviderRateLimitRow {
  providerId: string;
  provider: string;
  rateLimit: number;
}

export interface AdminLoginResponse {
  token: string;
  userName: string;
  expiresUtc: string;
}
