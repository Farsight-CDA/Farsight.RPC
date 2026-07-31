import { For, Show } from "solid-js";
import type { RpcProviderSummary } from "../lib/reference-data";
import ChevronDownIcon from "./icons/ChevronDownIcon";
import LoadingSpinner from "./LoadingSpinner";
import RpcCapabilitiesField, {
  type RpcCapability,
} from "./RpcCapabilitiesField";

type RpcStateFieldsProps = {
  idPrefix: string;
  ethGetLogsLimit: string;
  reportedEthGetLogsLimit: number | null;
  ethGetLogsError: string | null;
  onEthGetLogsLimitChange: (value: string) => void;
  providerId: string;
  providers: readonly RpcProviderSummary[];
  providersPending: boolean;
  providersReady: boolean;
  providersError: string | null;
  providersHref: string;
  providerAutoDetected?: boolean;
  onProviderChange: (providerId: string) => void;
  onCreateProvider: () => void;
  selectedCapabilities: ReadonlySet<RpcCapability>;
  reportedCapabilities: readonly RpcCapability[] | null;
  debugApiError?: string | null;
  tracingApiError?: string | null;
  capabilitiesAutoDetected?: boolean;
  onCapabilitiesChange: (capabilities: Set<RpcCapability>) => void;
};

export default function RpcStateFields(props: RpcStateFieldsProps) {
  const ethGetLogsLimitMatchesProbe = () =>
    props.reportedEthGetLogsLimit !== null &&
    Number(props.ethGetLogsLimit) === props.reportedEthGetLogsLimit;

  const handleCapabilitiesChange = (capabilities: Set<RpcCapability>) => {
    if (!capabilities.has("GetLogs")) {
      props.onEthGetLogsLimitChange("");
    }
    props.onCapabilitiesChange(capabilities);
  };

  return (
    <>
      <div class="flex flex-col gap-2">
        <div class="flex items-center gap-2">
          <label
            for={`${props.idPrefix}-provider`}
            class="text-xs font-bold uppercase tracking-widest text-b-ink/70"
          >
            Provider
          </label>
          <Show when={props.providerAutoDetected}>
            <span class="text-[10px] font-semibold uppercase tracking-wider text-green-400/70">
              Auto-detected
            </span>
          </Show>
        </div>
        <Show when={props.providersPending}>
          <div class="flex h-11 items-center gap-2 border border-b-border bg-b-field px-3">
            <LoadingSpinner class="size-4" />
            <span class="text-xs font-bold uppercase tracking-widest text-b-ink/50">
              Loading providers…
            </span>
          </div>
        </Show>
        <Show when={props.providersError}>
          {(error) => (
            <p class="border border-red-500/40 bg-red-500/10 px-3 py-3 text-xs font-bold uppercase leading-snug text-red-400">
              {error()}
            </p>
          )}
        </Show>
        <Show when={props.providersReady && props.providers.length > 0}>
          <div class="relative">
            <select
              id={`${props.idPrefix}-provider`}
              value={props.providerId}
              onChange={(event) =>
                props.onProviderChange(event.currentTarget.value)
              }
              class={`h-11 w-full appearance-none border border-b-border bg-b-field px-4 pr-10 text-sm font-bold tracking-widest outline-none focus-visible:border-b-accent/50 focus-visible:ring-2 focus-visible:ring-b-accent/20 hover:border-b-border-hover transition-all duration-200 cursor-pointer ${
                props.providerId ? "text-b-ink" : "text-b-ink/40"
              }`}
            >
              <option value="" disabled hidden class="bg-b-field">
                Select a provider…
              </option>
              <For each={props.providers}>
                {(provider) => (
                  <option value={provider.id} class="bg-b-field">
                    {provider.name}
                  </option>
                )}
              </For>
            </select>
            <div class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
              <ChevronDownIcon class="size-5 text-b-ink/50" />
            </div>
          </div>
        </Show>
        <Show when={props.providersReady && props.providers.length === 0}>
          <div class="flex flex-col gap-3 border border-dashed border-b-border/50 bg-b-paper/20 px-4 py-4">
            <p class="text-xs font-bold uppercase tracking-widest text-b-ink/50">
              No providers available.
            </p>
            <a
              href={props.providersHref}
              onClick={props.onCreateProvider}
              class="text-xs font-bold uppercase tracking-widest text-b-accent hover:text-b-accent-hover hover:underline transition-colors"
            >
              Create a provider first →
            </a>
          </div>
        </Show>
      </div>

      <RpcCapabilitiesField
        selectedCapabilities={props.selectedCapabilities}
        reportedCapabilities={props.reportedCapabilities}
        debugApiError={props.debugApiError}
        tracingApiError={props.tracingApiError}
        ethGetLogsError={props.ethGetLogsError}
        autoDetected={props.capabilitiesAutoDetected}
        onChange={handleCapabilitiesChange}
      />

      <Show when={props.selectedCapabilities.has("GetLogs")}>
        <div class="flex flex-col gap-2">
          <div class="flex items-center justify-between gap-2">
            <label
              for={`${props.idPrefix}-eth-get-logs-limit`}
              class="text-xs font-bold uppercase tracking-widest text-b-ink/70"
            >
              eth_getLogs Block Limit
            </label>
            <Show when={props.reportedEthGetLogsLimit}>
              {(limit) => (
                <Show
                  when={ethGetLogsLimitMatchesProbe()}
                  fallback={
                    <button
                      type="button"
                      onClick={() =>
                        props.onEthGetLogsLimitChange(String(limit()))
                      }
                      class="text-[10px] font-semibold uppercase tracking-wider text-green-400/70 transition-colors hover:text-green-400"
                    >
                      Use detected {limit().toLocaleString()}
                    </button>
                  }
                >
                  <span class="text-[10px] font-semibold uppercase tracking-wider text-green-400/70">
                    Auto-detected
                  </span>
                </Show>
              )}
            </Show>
          </div>
          <input
            id={`${props.idPrefix}-eth-get-logs-limit`}
            type="number"
            min="1"
            max={Number.MAX_SAFE_INTEGER}
            step="1"
            required
            value={props.ethGetLogsLimit}
            onInput={(event) =>
              props.onEthGetLogsLimitChange(event.currentTarget.value)
            }
            class="h-11 w-full border border-b-border bg-b-paper px-4 text-sm font-semibold text-b-ink placeholder:text-b-ink/25 outline-none focus-visible:border-b-accent/50 focus-visible:ring-2 focus-visible:ring-b-accent/20 hover:border-b-border-hover transition-all duration-200"
            placeholder="e.g. 10000"
            inputmode="numeric"
          />
          <p class="text-xs font-semibold uppercase tracking-wider text-b-ink/40">
            Maximum block range per eth_getLogs request.
          </p>
        </div>
      </Show>
    </>
  );
}
