import { createSignal, Show } from "solid-js";
import CheckmarkIcon from "./icons/CheckmarkIcon";
import CopyIcon from "./icons/CopyIcon";
import Modal from "./Modal";

export default function CreatedWalletApiKeyModal(props: {
  apiKey: string;
  onClose: () => void;
}) {
  const [copyState, setCopyState] = createSignal<"idle" | "copied" | "error">(
    "idle",
  );

  const copyKey = async () => {
    try {
      await navigator.clipboard.writeText(props.apiKey);
      setCopyState("copied");
    } catch {
      setCopyState("error");
    }
  };

  return (
    <Modal open={() => true} onClose={props.onClose}>
      <p class="mb-2 text-xs font-bold uppercase tracking-[0.35em] text-b-accent">
        Shown only once
      </p>
      <h3 class="mb-4 font-['Anton',sans-serif] text-4xl uppercase leading-none tracking-wide text-b-ink">
        Wallet API Key Created
      </h3>
      <p class="mb-4 text-sm font-semibold text-b-ink/70">
        Copy this key before closing. It can’t be viewed again, and anyone with
        it can sign for this wallet key.
      </p>
      <code class="mb-6 block select-all break-all border border-b-border bg-b-paper p-3 font-mono text-xs font-semibold tracking-wide text-b-ink/85">
        {props.apiKey}
      </code>
      <Show when={copyState() === "error"}>
        <p class="mb-4 text-sm text-red-400" role="alert">
          Couldn’t copy automatically. Select the key and copy it manually.
        </p>
      </Show>
      <div class="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={props.onClose}
          class="btn btn-md btn-interactive btn-secondary"
        >
          Done
        </button>
        <button
          type="button"
          onClick={() => void copyKey()}
          class="btn btn-md btn-interactive btn-primary"
          autofocus
        >
          {copyState() === "copied" ? (
            <CheckmarkIcon class="size-4" />
          ) : (
            <CopyIcon class="size-4" />
          )}
          {copyState() === "copied" ? "Copied" : "Copy key"}
        </button>
      </div>
    </Modal>
  );
}
