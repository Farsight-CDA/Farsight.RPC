import { API_KEY_HEADER } from "../constants.js";
import type { FetchLike } from "../types.js";

export function resolveGlobalFetch(): FetchLike {
  if(typeof globalThis.fetch !== "function") {
    throw new Error("No fetch implementation is available. Pass one in FarsightRpcClientOptions.fetch.");
  }

  return globalThis.fetch.bind(globalThis);
}

export function buildHeaders(apiKey?: string): HeadersInit | undefined {
  if(!apiKey) {
    return undefined;
  }

  return {
    [API_KEY_HEADER]: apiKey,
  };
}

export async function safeReadText(response: Response): Promise<string> {
  try {
    return await response.text();
  }
  catch {
    return "";
  }
}
