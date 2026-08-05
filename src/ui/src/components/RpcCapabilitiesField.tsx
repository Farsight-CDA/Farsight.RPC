import { For, Show } from "solid-js";
import CheckmarkIcon from "./icons/CheckmarkIcon";
import WarningIcon from "./icons/WarningIcon";

export const allRpcCapabilities = [
  "Archive",
  "DebugApi",
  "TracingApi",
  "StateOverrides",
  "BlockOverrides",
  "Subscriptions",
  "GetLogs",
  "SendRawTransaction",
] as const;

export type RpcCapability = (typeof allRpcCapabilities)[number];
export type RpcCapabilityError = {
  capability: RpcCapability;
  error: string;
};

export function formatRpcCapability(capability: RpcCapability): string {
  switch (capability) {
    case "DebugApi":
      return "Debug API";
    case "TracingApi":
      return "Tracing API";
    case "StateOverrides":
      return "State Overrides";
    case "BlockOverrides":
      return "Block Overrides";
    case "GetLogs":
      return "eth_getLogs";
    case "SendRawTransaction":
      return "eth_sendRawTransaction";
    default:
      return capability;
  }
}

export function rpcCapabilityStyle(capability: RpcCapability): string {
  switch (capability) {
    case "Archive":
      return "border-blue-500/30 bg-blue-500/10 text-blue-400";
    case "DebugApi":
      return "border-purple-500/30 bg-purple-500/10 text-purple-400";
    case "TracingApi":
      return "border-pink-500/30 bg-pink-500/10 text-pink-400";
    case "StateOverrides":
      return "border-amber-500/30 bg-amber-500/10 text-amber-400";
    case "BlockOverrides":
      return "border-cyan-500/30 bg-cyan-500/10 text-cyan-400";
    case "Subscriptions":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-400";
    case "GetLogs":
      return "border-orange-500/30 bg-orange-500/10 text-orange-400";
    case "SendRawTransaction":
      return "border-red-500/30 bg-red-500/10 text-red-400";
  }
}

type RpcCapabilitiesFieldProps = {
  selectedCapabilities: ReadonlySet<RpcCapability>;
  reportedCapabilities: readonly RpcCapability[] | null;
  errors?: readonly RpcCapabilityError[] | null;
  onChange: (capabilities: Set<RpcCapability>) => void;
  autoDetected?: boolean;
};

export default function RpcCapabilitiesField(
  props: RpcCapabilitiesFieldProps,
) {
  const toggleCapability = (capability: RpcCapability) => {
    const next = new Set(props.selectedCapabilities);
    if (next.has(capability)) {
      next.delete(capability);
    } else {
      next.add(capability);
    }
    props.onChange(next);
  };

  return (
    <div class="flex flex-col gap-2">
      <div class="flex items-center gap-2">
        <label class="text-xs font-bold uppercase tracking-widest text-b-ink/70">
          Capabilities
        </label>
        <Show when={props.autoDetected}>
          <span class="text-[10px] font-semibold uppercase tracking-wider text-green-400/70">
            Auto-detected
          </span>
        </Show>
      </div>
      <div class="flex flex-col gap-2">
        <For each={allRpcCapabilities}>
          {(capability) => {
            const checked = () => props.selectedCapabilities.has(capability);
            const reported = () =>
              props.reportedCapabilities?.includes(capability) ?? false;
            const errors = () => {
              if (props.reportedCapabilities === null || reported()) {
                return [];
              }
              return (
                props.errors
                  ?.filter((error) => error.capability === capability)
                  .map((error) => error.error) ?? []
              );
            };
            return (
              <label
                class={`flex cursor-pointer flex-col gap-1 border px-3 py-3 transition-all duration-150 ${
                  checked()
                    ? rpcCapabilityStyle(capability)
                    : "border-b-border bg-b-paper/20 text-b-ink/60 hover:border-b-border-hover"
                }`}
              >
                <div class="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={checked()}
                    onChange={() => toggleCapability(capability)}
                    class="size-4 accent-b-accent"
                  />
                  <span class="text-xs font-bold uppercase tracking-wider">
                    {formatRpcCapability(capability)}
                  </span>
                  <Show when={props.reportedCapabilities !== null}>
                    <span
                      class="ml-auto"
                      title={
                        reported()
                          ? "Reported as supported by probe"
                          : "Not reported as supported by probe"
                      }
                    >
                      <Show
                        when={reported()}
                        fallback={
                          <WarningIcon class="size-4 text-amber-300" />
                        }
                      >
                        <CheckmarkIcon class="size-4 text-green-400" />
                      </Show>
                    </span>
                  </Show>
                </div>
                <For each={errors()}>
                  {(error) => (
                    <p class="text-[0.65rem] font-semibold leading-snug text-amber-300">
                      {error}
                    </p>
                  )}
                </For>
              </label>
            );
          }}
        </For>
      </div>
    </div>
  );
}
