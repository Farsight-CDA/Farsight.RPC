import type {
  GetRpcsSuccessResult,
  RpcEndpoint,
  RpcProvider,
  RpcType,
  TracingMode,
} from "../types.js";
import {
  asArray,
  asRecord,
  readNumber,
  readRpcType,
  readString,
  readTracingMode,
} from "./validation.js";

type RawGetRpcsResponse = {
  Rpcs: Record<string, RawRpcEndpoint[]>;
  Providers: RawRpcProvider[];
};

type RawRpcProvider = {
  Id: string;
  Name: string;
  RateLimit: number;
};

type RawRpcEndpointBase = {
  type: RpcType;
  Id: string;
  Address: string;
  ProviderId: string;
};

type RawRealtimeRpcEndpoint = RawRpcEndpointBase & {
  type: "Realtime";
};

type RawArchiveRpcEndpoint = RawRpcEndpointBase & {
  type: "Archive";
  IndexerStepSize: number;
  IndexerBlockOffset: number;
};

type RawTracingRpcEndpoint = RawRpcEndpointBase & {
  type: "Tracing";
  TracingMode: TracingMode;
};

type RawRpcEndpoint = RawRealtimeRpcEndpoint | RawArchiveRpcEndpoint | RawTracingRpcEndpoint;

export function mapGetRpcsResponse(payload: unknown): GetRpcsSuccessResult {
  const response = asRecord(payload, "Expected the API response to be an object.") as Partial<RawGetRpcsResponse>;
  const rawRpcs = asRecord(response.Rpcs, "Expected response.Rpcs to be an object.");
  const providers = asArray(response.Providers, "Expected response.Providers to be an array.").map(mapProvider);

  const rpcs = Object.fromEntries(
    Object.entries(rawRpcs).map(([chain, value]) => [
      chain,
      asArray(value, `Expected response.Rpcs.${chain} to be an array.`).map(mapRpcEndpoint),
    ]),
  );

  return {
    kind: "success",
    rpcs,
    providers,
  };
}

function mapProvider(payload: unknown): RpcProvider {
  const provider = asRecord(payload, "Expected a provider object.") as Partial<RawRpcProvider>;

  return {
    id: readString(provider.Id, "Expected provider.Id to be a string."),
    name: readString(provider.Name, "Expected provider.Name to be a string."),
    rateLimit: readNumber(provider.RateLimit, "Expected provider.RateLimit to be a number."),
  };
}

function mapRpcEndpoint(payload: unknown): RpcEndpoint {
  const endpoint = asRecord(payload, "Expected an RPC endpoint object.") as Partial<RawRpcEndpoint>;
  const type = readRpcType(endpoint.type);
  const base = {
    id: readString(endpoint.Id, "Expected endpoint.Id to be a string."),
    address: readString(endpoint.Address, "Expected endpoint.Address to be a string."),
    providerId: readString(endpoint.ProviderId, "Expected endpoint.ProviderId to be a string."),
  };

  switch(type) {
    case "Realtime":
      return {
        ...base,
        type,
      };
    case "Archive": {
      const archive = endpoint as Partial<RawArchiveRpcEndpoint>;

      return {
        ...base,
        type,
        indexerStepSize: readNumber(archive.IndexerStepSize, "Expected endpoint.IndexerStepSize to be a number."),
        indexerBlockOffset: readNumber(archive.IndexerBlockOffset, "Expected endpoint.IndexerBlockOffset to be a number."),
      };
    }
    case "Tracing": {
      const tracing = endpoint as Partial<RawTracingRpcEndpoint>;

      return {
        ...base,
        type,
        tracingMode: readTracingMode(tracing.TracingMode),
      };
    }
  }
}
