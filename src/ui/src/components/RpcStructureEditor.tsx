import { For, Show } from "solid-js";
import {
  formatRequirement,
  normalizeRequirement,
  rpcTypeStructureKey,
  rpcTypes,
  type RpcRequirementMode,
  type RpcStructureDefinition,
  type RpcTypeName,
} from "../lib/rpc-structure";

type Props = {
  value: RpcStructureDefinition;
  disabled?: boolean;
  onChange: (value: RpcStructureDefinition) => void;
};

const modeOptions: { value: RpcRequirementMode; label: string }[] = [
  { value: "Fixed", label: "Fixed" },
  { value: "Range", label: "Range" },
  { value: "AtLeast", label: ">=" },
  { value: "AtMost", label: "<=" },
];

const typeStyles: Record<
  RpcTypeName,
  {
    accent: string;
    text: string;
    badge: string;
    border: string;
    focusRing: string;
  }
> = {
  Realtime: {
    accent: "border-l-4 border-l-green-500",
    text: "text-green-400",
    badge: "border-green-500/30 bg-green-500/10 text-green-400",
    border: "border-green-500/20",
    focusRing:
      "focus-visible:ring-green-500/20 focus-visible:border-green-500/50",
  },
  Archive: {
    accent: "border-l-4 border-l-blue-500",
    text: "text-blue-400",
    badge: "border-blue-500/30 bg-blue-500/10 text-blue-400",
    border: "border-blue-500/20",
    focusRing:
      "focus-visible:ring-blue-500/20 focus-visible:border-blue-500/50",
  },
  Tracing: {
    accent: "border-l-4 border-l-purple-500",
    text: "text-purple-400",
    badge: "border-purple-500/30 bg-purple-500/10 text-purple-400",
    border: "border-purple-500/20",
    focusRing:
      "focus-visible:ring-purple-500/20 focus-visible:border-purple-500/50",
  },
};

export default function RpcStructureEditor(props: Props) {
  const updateRequirement = (
    type: RpcTypeName,
    next: Partial<RpcStructureDefinition[keyof RpcStructureDefinition]>,
  ) => {
    const key = rpcTypeStructureKey[type];
    props.onChange({
      ...props.value,
      [key]: normalizeRequirement({ ...props.value[key], ...next }),
    });
  };

  return (
    <div class="grid gap-3">
      <For each={rpcTypes}>
        {(type, index) => {
          const key = rpcTypeStructureKey[type];
          const requirement = () => props.value[key];
          const style = typeStyles[type];

          return (
            <div
              class={`relative overflow-hidden border border-b-border bg-b-field ${style.accent}`}
            >
              <div class="flex flex-col gap-4 p-5 md:flex-row md:items-center">
                {/* Left: type info */}
                <div class="min-w-0 flex-1">
                  <div class="flex flex-wrap items-center gap-3">
                    <p
                      class={`font-['Anton',sans-serif] text-lg tracking-wide ${style.text}`}
                    >
                      {type}
                    </p>
                    <span
                      class={`inline-flex items-center border px-2 py-0.5 text-xs font-bold tracking-wider ${style.badge}`}
                    >
                      {formatRequirement(requirement())}
                    </span>
                  </div>
                </div>

                {/* Right: controls */}
                <div class="grid gap-3 sm:grid-cols-[8rem_1fr] md:w-[26rem]">
                  <label class="flex flex-col gap-1.5">
                    <span class="text-[0.6rem] font-bold uppercase tracking-widest text-b-ink/50">
                      Condition
                    </span>
                    <select
                      value={requirement().mode}
                      disabled={props.disabled}
                      onChange={(e) =>
                        updateRequirement(type, {
                          mode: e.currentTarget.value as RpcRequirementMode,
                        })
                      }
                      class={`h-10 border bg-b-paper px-3 text-xs font-bold uppercase tracking-wider text-b-ink outline-none transition-all duration-200 disabled:opacity-50 ${style.border} ${style.focusRing}`}
                    >
                      <For each={modeOptions}>
                        {(option) => (
                          <option value={option.value}>{option.label}</option>
                        )}
                      </For>
                    </select>
                  </label>

                  <Show
                    when={requirement().mode === "Range"}
                    fallback={
                      <label class="flex flex-col gap-1.5">
                        <span class="text-[0.6rem] font-bold uppercase tracking-widest text-b-ink/50">
                          Count
                        </span>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={requirement().count ?? 0}
                          disabled={props.disabled}
                          onInput={(e) =>
                            updateRequirement(type, {
                              count: e.currentTarget.valueAsNumber,
                            })
                          }
                          class={`h-10 border bg-b-paper px-3 text-sm font-semibold text-b-ink outline-none transition-all duration-200 disabled:opacity-50 ${style.border} ${style.focusRing}`}
                        />
                      </label>
                    }
                  >
                    <div class="grid grid-cols-2 gap-2">
                      <label class="flex flex-col gap-1.5">
                        <span class="text-[0.6rem] font-bold uppercase tracking-widest text-b-ink/50">
                          Min
                        </span>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={requirement().min ?? 0}
                          disabled={props.disabled}
                          onInput={(e) =>
                            updateRequirement(type, {
                              min: e.currentTarget.valueAsNumber,
                            })
                          }
                          class={`h-10 border bg-b-paper px-3 text-sm font-semibold text-b-ink outline-none transition-all duration-200 disabled:opacity-50 ${style.border} ${style.focusRing}`}
                        />
                      </label>
                      <label class="flex flex-col gap-1.5">
                        <span class="text-[0.6rem] font-bold uppercase tracking-widest text-b-ink/50">
                          Max
                        </span>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={requirement().max ?? 0}
                          disabled={props.disabled}
                          onInput={(e) =>
                            updateRequirement(type, {
                              max: e.currentTarget.valueAsNumber,
                            })
                          }
                          class={`h-10 border bg-b-paper px-3 text-sm font-semibold text-b-ink outline-none transition-all duration-200 disabled:opacity-50 ${style.border} ${style.focusRing}`}
                        />
                      </label>
                    </div>
                  </Show>
                </div>
              </div>
            </div>
          );
        }}
      </For>
    </div>
  );
}
