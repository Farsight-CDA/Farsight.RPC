import { createSignal, Show } from "solid-js";
import { useAuth } from "../lib/auth";
import { readErrorMessage } from "../lib/error-groups";
import CheckmarkIcon from "./icons/CheckmarkIcon";
import CopyIcon from "./icons/CopyIcon";
import EyeIcon from "./icons/EyeIcon";
import WarningIcon from "./icons/WarningIcon";
import LoadingSpinner from "./LoadingSpinner";
import Modal from "./Modal";
import SettingsSection from "./SettingsSection";

type MnemonicSectionProps = {
  walletId: string | undefined;
};

export default function MnemonicSection(props: MnemonicSectionProps) {
  const auth = useAuth();
  const [open, setOpen] = createSignal(false);
  const [mnemonic, setMnemonic] = createSignal<string | null>(null);
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  const [revealed, setRevealed] = createSignal(false);
  const [copied, setCopied] = createSignal(false);
  let copyFeedbackTimer: ReturnType<typeof setTimeout> | undefined;

  const words = () => (mnemonic() ?? "").split(/\s+/).filter(Boolean);
  const displayWords = () =>
    revealed()
      ? words()
      : words().map((word) => "•".repeat(word.length));

  const openModal = async () => {
    setOpen(true);
    if (mnemonic() !== null) return;

    const token = auth.token;
    const id = props.walletId;
    if (!token || !id) return;

    setError(null);
    setLoading(true);
    try {
      const response = await fetch(`/api/Wallets/${id}/Mnemonic`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        throw new Error(
          await readErrorMessage(response, "Failed to load mnemonic"),
        );
      }
      const data = (await response.json()) as { mnemonic: string };
      setMnemonic(data.mnemonic);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load mnemonic",
      );
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setOpen(false);
    setRevealed(false);
    setCopied(false);
    if (copyFeedbackTimer !== undefined) {
      clearTimeout(copyFeedbackTimer);
      copyFeedbackTimer = undefined;
    }
  };

  const handleCopy = () => {
    const value = mnemonic();
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

  return (
    <>
      <SettingsSection
        tone="warning"
        icon={<WarningIcon class="size-5 text-amber-400" />}
        title="Recovery Mnemonic"
        subtitle="Secret seed phrase of this wallet"
        headerAction={
          <button
            type="button"
            onClick={() => void openModal()}
            title="View mnemonic"
            aria-label="View mnemonic"
            class="btn btn-md btn-interactive btn-disabled btn-warning shrink-0"
          >
            <EyeIcon class="size-4" />
          </button>
        }
      />

      <Modal open={open} onClose={closeModal}>
        <h3
          class="mb-4 font-['Anton',sans-serif] text-4xl uppercase leading-none tracking-wide text-b-ink"
        >
          {mnemonic() === null ? "Loading…" : "Mnemonic"}
        </h3>

        <Show
          when={loading()}
          fallback={
            <Show
              when={mnemonic() !== null}
              fallback={
                <Show when={error()}>
                  <p class="mb-6 border border-red-500/40 bg-red-500/10 px-3 py-3 text-xs font-bold uppercase leading-snug text-red-400">
                    {error()}
                  </p>
                </Show>
              }
            >
              <p class="mb-4 text-sm font-semibold text-b-ink/70">
                Anyone with access to these {words().length} words can
                control the wallet. Keep them secret.
              </p>
              <div class="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {displayWords().map((word, index) => (
                  <div class="flex items-center gap-2 border border-b-border bg-b-paper px-3 py-2">
                    <span class="shrink-0 text-[0.65rem] font-bold tabular-nums text-b-ink/40">
                      {index + 1}
                    </span>
                    <span
                      class="truncate font-mono text-xs font-semibold tracking-wide text-b-ink/85"
                      aria-hidden={!revealed()}
                    >
                      {word}
                    </span>
                  </div>
                ))}
              </div>
            </Show>
          }
        >
          <div class="mb-6 flex items-center justify-center gap-3 py-12">
            <LoadingSpinner class="size-5 text-amber-400" />
            <p class="text-sm font-bold uppercase tracking-widest text-b-ink/60">
              Loading mnemonic…
            </p>
          </div>
        </Show>

        <div class="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => setRevealed((value) => !value)}
            disabled={loading() || mnemonic() === null}
            class="btn btn-md btn-interactive btn-disabled btn-secondary"
          >
            <EyeIcon class="size-4" />
            {revealed() ? "Hide" : "View"}
          </button>
          <button
            type="button"
            onClick={handleCopy}
            disabled={loading() || mnemonic() === null}
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
    </>
  );
}
