import { createEffect, createSignal, Show, type Accessor } from "solid-js";
import { formatDerivationPath } from "../lib/derivation-paths";
import CheckmarkIcon from "./icons/CheckmarkIcon";
import CopyIcon from "./icons/CopyIcon";
import EyeIcon from "./icons/EyeIcon";
import LoadingSpinner from "./LoadingSpinner";
import Modal from "./Modal";

type PrivateKeyModalProps = {
  privateKey: Accessor<{
    id: string;
    curve: string;
    derivationPath: string;
    publicKey: string;
  } | null>;
  loadKey: (privateKeyId: string) => Promise<string>;
  onClose: () => void;
};

export default function PrivateKeyModal(props: PrivateKeyModalProps) {
  const [keyValue, setKeyValue] = createSignal<string | null>(null);
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  const [revealed, setRevealed] = createSignal(false);
  const [copied, setCopied] = createSignal(false);
  const [pathCopied, setPathCopied] = createSignal(false);
  const [publicKeyCopied, setPublicKeyCopied] = createSignal(false);
  let copyFeedbackTimer: ReturnType<typeof setTimeout> | undefined;
  let pathCopyFeedbackTimer: ReturnType<typeof setTimeout> | undefined;
  let publicKeyCopyFeedbackTimer: ReturnType<typeof setTimeout> | undefined;

  const load = async (privateKeyId: string) => {
    setError(null);
    setLoading(true);
    setKeyValue(null);
    setRevealed(false);
    setCopied(false);
    setPathCopied(false);
    setPublicKeyCopied(false);
    try {
      setKeyValue(await props.loadKey(privateKeyId));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load private key",
      );
    } finally {
      setLoading(false);
    }
  };

  createEffect(() => {
    const key = props.privateKey();
    if (key !== null) void load(key.id);
  });

  const closeModal = () => {
    props.onClose();
    setRevealed(false);
    setCopied(false);
    setPathCopied(false);
    setPublicKeyCopied(false);
    if (copyFeedbackTimer !== undefined) {
      clearTimeout(copyFeedbackTimer);
      copyFeedbackTimer = undefined;
    }
    if (pathCopyFeedbackTimer !== undefined) {
      clearTimeout(pathCopyFeedbackTimer);
      pathCopyFeedbackTimer = undefined;
    }
    if (publicKeyCopyFeedbackTimer !== undefined) {
      clearTimeout(publicKeyCopyFeedbackTimer);
      publicKeyCopyFeedbackTimer = undefined;
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

  const handleCopyPath = () => {
    const value = props.privateKey()?.derivationPath;
    if (!value) return;
    void navigator.clipboard.writeText(value);
    if (pathCopyFeedbackTimer !== undefined) {
      clearTimeout(pathCopyFeedbackTimer);
    }
    setPathCopied(true);
    pathCopyFeedbackTimer = setTimeout(() => {
      setPathCopied(false);
      pathCopyFeedbackTimer = undefined;
    }, 2000);
  };

  const handleCopyPublicKey = () => {
    const value = props.privateKey()?.publicKey;
    if (!value) return;
    void navigator.clipboard.writeText(value);
    if (publicKeyCopyFeedbackTimer !== undefined) {
      clearTimeout(publicKeyCopyFeedbackTimer);
    }
    setPublicKeyCopied(true);
    publicKeyCopyFeedbackTimer = setTimeout(() => {
      setPublicKeyCopied(false);
      publicKeyCopyFeedbackTimer = undefined;
    }, 2000);
  };

  const maskedValue = () => (keyValue() ?? "").replace(/./g, "•");

  return (
    <Modal open={() => props.privateKey() !== null} onClose={closeModal}>
      <h3
        class="mb-4 font-['Anton',sans-serif] text-4xl uppercase leading-none tracking-wide text-b-ink"
      >
        {loading() ? "Loading…" : "Private Key"}
      </h3>

      <Show
        when={loading()}
        fallback={
          <Show
            when={error()}
            fallback={
              <Show when={keyValue() !== null}>
                <div class="mb-6 flex flex-col gap-4">
                  <p class="font-mono text-[0.7rem] font-semibold tracking-widest text-b-ink/45">
                    {props.privateKey()?.curve}
                    {" · "}
                    {props.privateKey()
                      ? formatDerivationPath(
                          props.privateKey()!.derivationPath,
                        )
                      : ""}
                  </p>
                  <div>
                    <div class="mb-2 flex items-center justify-between gap-3">
                      <p class="text-xs font-bold uppercase tracking-widest text-b-ink/70">
                        Derivation Path
                      </p>
                      <button
                        type="button"
                        onClick={handleCopyPath}
                        class="btn btn-sm btn-interactive btn-disabled btn-secondary"
                      >
                        {pathCopied() ? (
                          <CheckmarkIcon class="size-3.5" />
                        ) : (
                          <CopyIcon class="size-3.5" />
                        )}
                        {pathCopied() ? "Copied" : "Copy"}
                      </button>
                    </div>
                    <code class="block select-all break-all border border-b-border bg-b-paper p-3 font-mono text-xs font-semibold tracking-wide text-b-ink/85">
                      {props.privateKey()?.derivationPath}
                    </code>
                  </div>
                  <div>
                    <div class="mb-2 flex items-center justify-between gap-3">
                      <p class="text-xs font-bold uppercase tracking-widest text-b-ink/70">
                        Public Key
                      </p>
                      <button
                        type="button"
                        onClick={handleCopyPublicKey}
                        class="btn btn-sm btn-interactive btn-disabled btn-secondary"
                      >
                        {publicKeyCopied() ? (
                          <CheckmarkIcon class="size-3.5" />
                        ) : (
                          <CopyIcon class="size-3.5" />
                        )}
                        {publicKeyCopied() ? "Copied" : "Copy"}
                      </button>
                    </div>
                    <code class="block select-all break-all border border-b-border bg-b-paper p-3 font-mono text-xs font-semibold tracking-wide text-b-ink/85">
                      {props.privateKey()?.publicKey}
                    </code>
                  </div>
                </div>
                <p class="mb-4 text-sm font-semibold text-b-ink/70">
                  Anyone with access to this private key can control the
                  wallet. Keep it secret.
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
            Loading private key…
          </p>
        </div>
      </Show>

      <div class="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={() => setRevealed((value) => !value)}
          disabled={loading() || keyValue() === null}
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
