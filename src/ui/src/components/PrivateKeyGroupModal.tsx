import { createEffect, createSignal, Show, type Accessor } from "solid-js";
import LoadingSpinner from "./LoadingSpinner";
import Modal from "./Modal";
import {
  nameValidationHint,
  nameValidationPattern,
  validateName,
} from "../lib/name-validation";

type PrivateKeyGroupModalProps = {
  open: Accessor<boolean>;
  mode: Accessor<"create" | "edit">;
  initialName: Accessor<string>;
  initialDescription: Accessor<string>;
  loading: Accessor<boolean>;
  error: Accessor<string | null>;
  onClose: () => void;
  onSubmit: (name: string, description: string) => void;
};

export default function PrivateKeyGroupModal(props: PrivateKeyGroupModalProps) {
  const [name, setName] = createSignal("");
  const [description, setDescription] = createSignal("");
  const [formError, setFormError] = createSignal<string | null>(null);

  createEffect(() => {
    if (props.open()) {
      setName(props.initialName());
      setDescription(props.initialDescription());
      setFormError(null);
    }
  });

  const isCreate = () => props.mode() === "create";

  const handleSubmit = (e: SubmitEvent) => {
    e.preventDefault();
    const validationError = validateName(name());
    if (validationError) {
      setFormError(validationError);
      return;
    }
    setFormError(null);
    props.onSubmit(name(), description());
  };

  const displayedError = () => formError() ?? props.error();

  return (
    <Modal open={props.open} onClose={props.onClose}>
      <p class="mb-2 text-xs font-bold uppercase tracking-[0.35em] text-b-accent">
        {isCreate() ? "Create" : "Edit"}
      </p>
      <h3
        id="private-key-group-modal-title"
        class="mb-8 font-['Anton',sans-serif] text-4xl uppercase leading-none tracking-wide text-b-ink"
      >
        {isCreate() ? "New Key Group" : "Edit Key Group"}
      </h3>

      <form onSubmit={handleSubmit} class="flex flex-col gap-6">
        <div class="flex flex-col gap-2">
          <label
            for="private-key-group-name"
            class="text-xs font-bold uppercase tracking-widest text-b-ink/70"
          >
            Group name
          </label>
          <input
            id="private-key-group-name"
            type="text"
            required
            pattern={nameValidationPattern}
            value={name()}
            onInput={(event) => {
              setName(event.currentTarget.value);
              setFormError(null);
            }}
            placeholder="DeFi trading"
            class="h-11 w-full border border-b-border bg-b-field px-4 text-sm font-semibold text-b-ink placeholder:text-b-ink/25 outline-none transition-all duration-200 hover:border-b-border-hover focus-visible:border-b-accent/50 focus-visible:ring-2 focus-visible:ring-b-accent/20"
            title={nameValidationHint}
            autocomplete="off"
            autofocus
          />
        </div>

        <div class="flex flex-col gap-2">
          <label
            for="private-key-group-description"
            class="text-xs font-bold uppercase tracking-widest text-b-ink/70"
          >
            Description
          </label>
          <textarea
            id="private-key-group-description"
            value={description()}
            onInput={(event) => {
              setDescription(event.currentTarget.value);
              setFormError(null);
            }}
            placeholder="What is this group for?"
            rows={4}
            class="w-full resize-y border border-b-border bg-b-field px-4 py-3 text-sm font-semibold text-b-ink placeholder:text-b-ink/25 outline-none transition-all duration-200 hover:border-b-border-hover focus-visible:border-b-accent/50 focus-visible:ring-2 focus-visible:ring-b-accent/20"
            autocomplete="off"
          />
          <p class="text-xs font-semibold text-b-ink/45">
            Optional. Describe the purpose of this group.
          </p>
        </div>

        <Show when={displayedError()}>
          <p class="border border-red-500/40 bg-red-500/10 px-3 py-3 text-xs font-bold uppercase leading-snug text-red-400">
            {displayedError()}
          </p>
        </Show>

        <div class="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={props.onClose}
            disabled={props.loading()}
            class="btn btn-md btn-interactive btn-disabled btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={props.loading()}
            class="btn btn-md btn-interactive btn-disabled btn-primary"
          >
            <Show when={props.loading()}>
              <LoadingSpinner class="size-3.5 text-b-paper" />
            </Show>
            {props.loading()
              ? isCreate()
                ? "Creating…"
                : "Saving…"
              : isCreate()
                ? "Create Group"
                : "Save Changes"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
