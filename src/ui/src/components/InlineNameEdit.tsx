import { createSignal, Show, type Accessor } from "solid-js";
import LoadingSpinner from "./LoadingSpinner";
import PencilIcon from "./icons/PencilIcon";
import {
  nameValidationHint,
  nameValidationPattern,
  validateName,
} from "../lib/name-validation";

type InlineNameEditProps = {
  value: Accessor<string>;
  onSave: (name: string) => Promise<void>;
  disabled?: Accessor<boolean>;
  label?: string;
  editButtonTitle?: string;
  inputId?: string;
};

export default function InlineNameEdit(props: InlineNameEditProps) {
  const [isEditing, setIsEditing] = createSignal(false);
  const [editingName, setEditingName] = createSignal("");
  const [error, setError] = createSignal<string | null>(null);
  const [loading, setLoading] = createSignal(false);

  const isDisabled = () => props.disabled?.() ?? false;

  const startEditing = () => {
    if (isDisabled()) return;
    setError(null);
    setEditingName(props.value());
    setIsEditing(true);
  };

  const cancelEditing = () => {
    if (loading()) return;
    setIsEditing(false);
    setError(null);
  };

  const handleSave = async () => {
    if (isDisabled()) return;

    const name = editingName();
    const validationError = validateName(name);
    if (validationError) {
      setError(validationError);
      return;
    }

    if (name === props.value()) {
      setIsEditing(false);
      setError(null);
      return;
    }

    setError(null);
    setLoading(true);
    try {
      await props.onSave(name);
      setIsEditing(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update name",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Show
      when={isEditing()}
      fallback={
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p class="text-xs font-bold uppercase tracking-widest text-b-ink/50 mb-1">
              {props.label ?? "Name"}
            </p>
            <p class="font-['Anton',sans-serif] text-2xl tracking-wide text-b-ink">
              {props.value()}
            </p>
          </div>
          <button
            type="button"
            onClick={startEditing}
            disabled={isDisabled()}
            class="btn btn-md btn-interactive btn-disabled btn-secondary shrink-0"
            title={props.editButtonTitle ?? "Rename"}
          >
            <PencilIcon class="size-4" />
          </button>
        </div>
      }
    >
      <div class="flex flex-col gap-3">
        <div class="flex flex-col gap-2">
          <label
            for={props.inputId ?? "edit-name"}
            class="text-xs font-bold uppercase tracking-widest text-b-ink/70"
          >
            {props.label ?? "Name"}
          </label>
          <input
            id={props.inputId ?? "edit-name"}
            type="text"
            required
            pattern={nameValidationPattern}
            value={editingName()}
            onInput={(e) => {
              setEditingName(e.currentTarget.value);
              setError(null);
            }}
            class="h-11 w-full border border-b-border bg-b-paper px-4 text-sm font-semibold text-b-ink placeholder:text-b-ink/25 outline-none focus-visible:border-b-accent/50 focus-visible:ring-2 focus-visible:ring-b-accent/20 hover:border-b-border-hover transition-all duration-200"
            title={nameValidationHint}
            autocomplete="off"
          />
          <p class="text-xs font-semibold uppercase tracking-wider text-b-ink/40">
            {nameValidationHint}
          </p>
        </div>

        <Show when={error()}>
          <p class="border border-red-500/40 bg-red-500/10 px-3 py-3 text-xs font-bold uppercase leading-snug text-red-400">
            {error()}
          </p>
        </Show>

        <div class="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={cancelEditing}
            disabled={loading() || isDisabled()}
            class="btn btn-md btn-interactive btn-disabled btn-secondary"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={loading() || isDisabled()}
            class="btn btn-md btn-interactive btn-disabled btn-primary"
          >
            <Show when={loading()}>
              <LoadingSpinner class="size-3.5 text-b-paper" />
            </Show>
            {loading() ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </Show>
  );
}
