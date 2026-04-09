import { Show, type Component } from "solid-js";

interface Props {
  message?: string | null;
  tone?: "success" | "error";
}

const toneClasses = {
  success: "border-emerald-500/30 bg-emerald-950/40 text-emerald-100",
  error: "border-red-500/30 bg-red-950/40 text-red-100",
};

export const MessageBanner: Component<Props> = (props) => (
  <Show when={props.message}>
    <div class={`rounded-2xl border px-4 py-3 text-sm ${toneClasses[props.tone ?? "success"]}`}>{props.message}</div>
  </Show>
);
