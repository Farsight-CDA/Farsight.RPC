import { createEffect, createSignal, Show, type Accessor } from "solid-js";
import CheckmarkIcon from "./icons/CheckmarkIcon";
import CopyIcon from "./icons/CopyIcon";
import EyeIcon from "./icons/EyeIcon";
import LoadingSpinner from "./LoadingSpinner";
import Modal from "./Modal";

type ApiKeyModalProps = {
  apiKey: Accessor<{ id: string; name: string } | null>;
  loadKey: (apiKeyId: string) => Promise<string>;
  onClose: () => void;
  description?: string;
};

export default function ApiKeyModal(props: ApiKeyModalProps) {
  const [keyValue, setKeyValue] = createSignal<string | null>(null);
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  const [revealed, setRevealed] = createSignal(false);
  const [copied, setCopied] = createSignal(false);
  let copyFeedbackTimer: ReturnType<typeof setTimeout> | undefined;

  const load = async (apiKeyId: string) => {
    setError(null);
    setLoading(true);
    setKeyValue(null);
    setRevealed(false);
    setCopied(false);
    try {
      setKeyValue(await props.loadKey(apiKeyId));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load API key",
      );
    } finally {
      setLoading(false);
    }
  };

  createEffect(() => {
    const key = props.apiKey();
    if (key !== null) void load(key.id);
  });

  const closeModal = () => {
    props.onClose();
    setRevealed(false);
    setCopied(false);
    if (copyFeedbackTimer !== undefined) {
      clearTimeout(copyFeedbackTimer);
      copyFeedbackTimer = undefined;
    }
  };

  const handleCopy = () => {
    const value = keyValue();
    if (value === null) return;
    void navigator.clipboard.writeText(value);
    if (copyFeedbackTimer !== undefined) {
      clearTimeout(copyFeedbackTimer);
    }
    setCopied(true);
    copyFeedbackTimer = setTimeout(() => {
      setCopied(false);
      copyFeedbackTimer = undefined;
    }, 2000);
  };

  const handleViewClick = () => {
    if (keyValue() !== null) {
      setRevealed((value) => !value);
      return;
    }
    const key = props.apiKey();
    if (key !== null) void load(key.id);
  };

  const maskedValue = () => (keyValue() ?? "").replace(/./g, "•");

  return (
    <Modal open={() => props.apiKey() !== null} onClose={closeModal}>
      <h3
        class="mb-4 font-['Anton',sans-serif] text-4xl uppercase leading-none tracking-wide text-b-ink"
      >
        {loading() ? "Loading…" : "API Key"}
      </h3>

      <Show
        when={loading()}
        fallback={
          <Show
            when={error()}
            fallback={
              <Show when={keyValue() !== null}>
                <p class="mb-4 text-sm font-semibold text-b-ink/70">
                  {props.description ??
                    "Anyone with access to this key can use it. Do not share it."}
                </p>
                <code
                  class="mb-6 block select-all break-all border border-b-border bg-b-paper p-3 font-mono text-xs font-semibold tracking-wide text-b-ink/85"
                  aria-hidden={!revealed()}
                >
                  {revealed() ? keyValue() : maskedValue()}
                </code>
              </Show>
            }
          >
            <p class="mb-6 border border-red-500/40 bg-red-500/10 px-3 py-3 text-xs font-bold uppercase leading-snug text-red-400">
              {error()}
            </p>
          </Show>
        }
      >
        <div class="mb-6 flex items-center justify-center gap-3 py-12">
          <LoadingSpinner class="size-5 text-b-accent" />
          <p class="text-sm font-bold uppercase tracking-widest text-b-ink/60">
            Loading key…
          </p>
        </div>
      </Show>

      <div class="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={handleViewClick}
          disabled={loading() || props.apiKey() === null}
          class="btn btn-md btn-interactive btn-disabled btn-secondary"
        >
          <EyeIcon class="size-4" />
          {revealed() ? "Hide" : "View"}
        </button>
        <button
          type="button"
          onClick={handleCopy}
          disabled={loading() || keyValue() === null}
          class="btn btn-md btn-interactive btn-disabled btn-primary"
        >
          {copied() ? (
            <CheckmarkIcon class="size-4 text-b-paper" />
          ) : (
            <CopyIcon class="size-4" />
          )}
          {copied() ? "Copied" : "Copy"}
        </button>
      </div>
    </Modal>
  );
}
