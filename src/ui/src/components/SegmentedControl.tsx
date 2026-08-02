import { For } from "solid-js";

type SegmentedControlOption<T extends string | number> = {
  value: T;
  label: string;
};

type SegmentedControlProps<T extends string | number> = {
  options: SegmentedControlOption<T>[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
};

export default function SegmentedControl<T extends string | number>(
  props: SegmentedControlProps<T>,
) {
  return (
    <div class="flex border border-b-border bg-b-paper p-0.5">
      <For each={props.options}>
        {(option) => (
          <button
            type="button"
            disabled={props.disabled}
            onClick={() => props.onChange(option.value)}
            class={`h-6 px-3 text-[0.65rem] font-bold uppercase tracking-widest transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-b-accent/40 disabled:opacity-40 disabled:cursor-not-allowed ${
              props.value === option.value
                ? "bg-b-accent text-b-paper"
                : "text-b-ink/50 hover:text-b-ink"
            }`}
          >
            {option.label}
          </button>
        )}
      </For>
    </div>
  );
}
