import { Show, type Accessor, type JSX } from "solid-js";
import { createModalBackdropHandlers } from "../lib/createModalBackdropHandlers";
import { useEscapeKey } from "../lib/useEscapeKey";

type ModalProps = {
  open: Accessor<boolean>;
  onClose: () => void;
  children: JSX.Element;
  danger?: boolean;
  zClass?: string;
};

export default function Modal(props: ModalProps) {
  useEscapeKey(props.open, props.onClose);
  const backdropHandlers = createModalBackdropHandlers(props.onClose);

  return (
    <Show when={props.open()}>
      <div
        class={`fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4 py-8 ${props.zClass ?? ""}`}
        role="presentation"
        {...backdropHandlers}
      >
        <div
          role="dialog"
          aria-modal="true"
          class={`w-full max-w-md border ${
            props.danger ? "border-red-500/30" : "border-b-border"
          } bg-b-field p-8 shadow-[0_25px_50px_rgba(0,0,0,0.5)]`}
          onClick={(e) => e.stopPropagation()}
        >
          {props.children}
        </div>
      </div>
    </Show>
  );
}
