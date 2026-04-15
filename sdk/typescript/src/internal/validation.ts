import type { RpcType, TracingMode } from "../types.js";

export function readRpcType(value: unknown): RpcType {
  switch(value) {
    case "Realtime":
    case "Archive":
    case "Tracing":
      return value;
    default:
      throw new TypeError("Expected endpoint.type to be Realtime, Archive, or Tracing.");
  }
}

export function readTracingMode(value: unknown): TracingMode {
  switch(value) {
    case "Debug":
    case "Trace":
      return value;
    default:
      throw new TypeError("Expected endpoint.TracingMode to be Debug or Trace.");
  }
}

export function readString(value: unknown, message: string): string {
  if(typeof value !== "string") {
    throw new TypeError(message);
  }

  return value;
}

export function readNumber(value: unknown, message: string): number {
  if(typeof value !== "number" || Number.isNaN(value)) {
    throw new TypeError(message);
  }

  return value;
}

export function asRecord(value: unknown, message: string): Record<string, unknown> {
  if(value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(message);
  }

  return value as Record<string, unknown>;
}

export function asArray(value: unknown, message: string): unknown[] {
  if(!Array.isArray(value)) {
    throw new TypeError(message);
  }

  return value;
}
