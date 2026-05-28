import { createSignal, For, Show } from "solid-js";

const PRESET_COLORS = [
  "#EF4444",
  "#F97316",
  "#EAB308",
  "#22C55E",
  "#14B8A6",
  "#3B82F6",
  "#8B5CF6",
];

type ColorPickerProps = {
  value: string;
  onChange: (color: string) => void;
  disabled?: boolean;
};

export default function ColorPicker(props: ColorPickerProps) {
  const [customMode, setCustomMode] = createSignal(false);
  const [customValue, setCustomValue] = createSignal("");

  const isPresetActive = () => PRESET_COLORS.includes(props.value);

  const isCustomActive = () => !PRESET_COLORS.includes(props.value);

  const handlePresetClick = (color: string) => {
    if (props.disabled) return;
    setCustomMode(false);
    props.onChange(color);
  };

  const handleCustomToggle = () => {
    if (props.disabled) return;
    if (customMode()) {
      setCustomMode(false);
      setCustomValue("");
    } else {
      setCustomMode(true);
      if (isCustomActive()) {
        setCustomValue(props.value);
      }
    }
  };

  const handleCustomInput = (val: string) => {
    let hex = val;
    if (hex && !hex.startsWith("#")) {
      hex = "#" + hex;
    }
    setCustomValue(hex);
    if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
      props.onChange(hex);
    }
  };

  const handleCustomSubmit = () => {
    const hex = customValue();
    if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
      props.onChange(hex);
      setCustomMode(false);
    }
  };

  return (
    <div class="flex flex-col gap-3">
      <div class="flex flex-wrap gap-2">
        <For each={PRESET_COLORS}>
          {(color) => (
            <button
              type="button"
              disabled={props.disabled}
              onClick={() => handlePresetClick(color)}
              class="relative size-8 border-2 transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-b-accent/40 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                "background-color": color,
                "border-color":
                  props.value === color ? "#fff" : "transparent",
                "box-shadow":
                  props.value === color
                    ? `0 0 0 2px ${color}`
                    : "none",
              }}
              title={color}
            />
          )}
        </For>
        <button
          type="button"
          disabled={props.disabled}
          onClick={handleCustomToggle}
          class={`flex size-8 items-center justify-center border-2 text-xs font-bold transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-b-accent/40 disabled:opacity-40 disabled:cursor-not-allowed ${
            customMode() || isCustomActive()
              ? "border-b-accent bg-b-accent/10 text-b-accent"
              : "border-b-border bg-b-field text-b-ink/50 hover:border-b-border-hover"
          }`}
          title="Custom hex color"
        >
          #
        </button>
      </div>

      <Show when={customMode()}>
        <div class="flex items-center gap-2">
          <input
            type="text"
            value={customValue()}
            onInput={(e) => handleCustomInput(e.currentTarget.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleCustomSubmit();
              }
            }}
            maxlength={7}
            placeholder="#FF5722"
            disabled={props.disabled}
            class="h-9 w-28 border border-b-border bg-b-paper px-3 text-sm font-mono font-semibold text-b-ink placeholder:text-b-ink/25 outline-none focus-visible:border-b-accent/50 focus-visible:ring-2 focus-visible:ring-b-accent/20 hover:border-b-border-hover transition-all duration-200"
          />
          <button
            type="button"
            onClick={handleCustomSubmit}
            disabled={
              props.disabled || !/^#[0-9A-Fa-f]{6}$/.test(customValue())
            }
            class="btn btn-sm btn-interactive btn-disabled btn-primary"
          >
            Apply
          </button>
        </div>
      </Show>

      <div class="flex items-center gap-2">
        <div
          class="size-5 border border-b-border"
          style={{ "background-color": props.value }}
        />
        <span class="text-xs font-mono font-semibold text-b-ink/60">
          {props.value}
        </span>
      </div>
    </div>
  );
}
