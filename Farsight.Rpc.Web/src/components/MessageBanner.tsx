import { Show, type Component } from "solid-js";

interface Props {
  message?: string | null;
  tone?: "success" | "error";
}

export const MessageBanner: Component<Props> = (props) => (
  <Show when={props.message}>
    <div class={`message ${props.tone ?? "success"}`}>{props.message}</div>
  </Show>
);
