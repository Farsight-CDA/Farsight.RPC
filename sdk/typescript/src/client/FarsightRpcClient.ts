import { DEFAULT_API_URL } from "../constants.js";
import { FarsightRpcHttpError } from "../errors/FarsightRpcHttpError.js";
import { buildHeaders, resolveGlobalFetch, safeReadText } from "../internal/fetch.js";
import { mapGetRpcsResponse } from "../internal/mapGetRpcsResponse.js";
import type { FarsightRpcClientOptions, GetRpcsOptions, GetRpcsResult } from "../types.js";

export class FarsightRpcClient {
  private readonly apiUrl: string | URL;
  private readonly apiKey?: string;
  private readonly fetchImplementation;

  public constructor(options: FarsightRpcClientOptions = {}) {
    this.apiUrl = options.apiUrl ?? DEFAULT_API_URL;
    this.apiKey = options.apiKey ?? undefined;
    this.fetchImplementation = options.fetch ?? resolveGlobalFetch();
  }

  public async getRpcs(options: GetRpcsOptions = {}): Promise<GetRpcsResult> {
    const response = await this.fetchImplementation(new URL("/api/Rpcs", this.apiUrl), {
      headers: buildHeaders(this.apiKey),
      signal: options.signal,
    });

    switch(response.status) {
      case 403:
        return { kind: "invalid-api-key" };
      case 200:
        return mapGetRpcsResponse(await response.json());
      default:
        throw new FarsightRpcHttpError(response.status, await safeReadText(response));
    }
  }
}
