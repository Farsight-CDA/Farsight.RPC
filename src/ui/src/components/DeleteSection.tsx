import { Show, type Accessor, type JSX } from "solid-js";
import { createSignal } from "solid-js";
import LoadingSpinner from "./LoadingSpinner";
import Modal from "./Modal";
import SettingsSection from "./SettingsSection";
import TrashIcon from "./icons/TrashIcon";

type DeleteSectionProps = {
  title: string;
  subtitle: string;
  onDelete: () => Promise<void>;
  disabled?: Accessor<boolean>;
  buttonTitle?: string;
  children?: JSX.Element;
};

export default function DeleteSection(props: DeleteSectionProps) {
  const [showConfirm, setShowConfirm] = createSignal(false);
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);

  const isDisabled = () => props.disabled?.() ?? false;

  const handleDelete = async () => {
    if (isDisabled()) return;
    setError(null);
    setLoading(true);
    try {
      await props.onDelete();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete",
      );
    } finally {
      setLoading(false);
    }
  };

  const closeConfirm = () => {
    if (loading()) return;
    setShowConfirm(false);
    setError(null);
  };

  return (
    <>
      <SettingsSection
        tone="danger"
        icon={<TrashIcon class="size-5 text-red-400" />}
        title={props.title}
        subtitle={props.subtitle}
        headerAction={
          <button
            type="button"
            onClick={() => setShowConfirm(true)}
            disabled={isDisabled()}
            class="btn btn-md btn-interactive btn-disabled btn-danger shrink-0"
            title={props.buttonTitle ?? "Delete"}
          >
            <TrashIcon class="size-4" />
          </button>
        }
      />

      <Modal open={showConfirm} onClose={closeConfirm} danger>
        <p class="mb-2 text-xs font-bold uppercase tracking-[0.35em] text-red-400">
          Confirm Deletion
        </p>
        <h3 class="mb-4 font-['Anton',sans-serif] text-4xl uppercase leading-none tracking-wide text-b-ink">
          {props.title}
        </h3>
        <div class="mb-4 text-sm font-semibold text-b-ink/70">
          {props.children}
        </div>

        <Show when={error()}>
          <p class="mb-6 border border-red-500/40 bg-red-500/10 px-3 py-3 text-xs font-bold uppercase leading-snug text-red-400">
            {error()}
          </p>
        </Show>

        <div class="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={closeConfirm}
            disabled={loading()}
            class="btn btn-md btn-interactive btn-disabled btn-secondary"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleDelete()}
            disabled={loading() || isDisabled()}
            class="btn btn-md btn-interactive btn-disabled btn-danger"
          >
            <Show when={loading()}>
              <LoadingSpinner class="size-3.5" />
            </Show>
            {loading() ? "Deleting…" : "Delete"}
          </button>
        </div>
      </Modal>
    </>
  );
}
