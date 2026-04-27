import { A, useNavigate } from "@solidjs/router";
import { createSignal, For, Show } from "solid-js";
import LoadingSpinner from "../components/LoadingSpinner";
import BackIcon from "../components/icons/BackIcon";
import ErrorGroupIcon from "../components/icons/ErrorGroupIcon";
import { useAuth } from "../lib/auth";
import {
  nameValidationHint,
  nameValidationPattern,
  validateName,
} from "../lib/name-validation";
import { useReferenceData } from "../lib/reference-data";
import { ACTION_OPTIONS, readErrorMessage } from "../lib/error-groups";

export default function ErrorGroupNewPage() {
  const auth = useAuth();
  const referenceData = useReferenceData();
  const navigate = useNavigate();

  const [name, setName] = createSignal("");
  const [action, setAction] = createSignal("Transient");
  const [formError, setFormError] = createSignal<string | null>(null);
  const [loading, setLoading] = createSignal(false);

  const handleSubmit = async (e: SubmitEvent) => {
    e.preventDefault();
    const token = auth.token;
    if (!token) return;

    const groupName = name();
    const validationError = validateName(groupName);
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setFormError(null);
    setLoading(true);
    try {
      const response = await fetch("/api/RpcErrorGroups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: groupName,
          action: action(),
          errors: [],
        }),
      });
      if (!response.ok) {
        throw new Error(
          await readErrorMessage(
            response,
            "Failed to create error group",
            "An error group with this name already exists.",
          ),
        );
      }
      await referenceData.refreshErrorGroups();
      const created = referenceData.errorGroups
        .data()
        .find((g) => g.name === groupName);
      if (created) {
        navigate(`/errors/${created.id}`);
      } else {
        navigate("/errors");
      }
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Failed to create error group",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main class="flex flex-1 flex-col items-center gap-8 px-4 sm:px-6 py-8 sm:py-12">
      <div class="w-full max-w-3xl">
        <A
          href="/errors"
          class="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-b-ink/50 hover:text-b-accent transition-colors duration-200 mb-6"
        >
          <BackIcon class="size-3" />
          Back
        </A>

        <section class="border border-b-border bg-b-field overflow-hidden">
          <div class="border-b border-b-border bg-b-paper/30 px-6 py-4">
            <div class="flex items-center gap-3">
              <div class="flex size-10 items-center justify-center border border-b-accent/30 bg-b-accent/10">
                <ErrorGroupIcon class="size-5 text-b-accent" />
              </div>
              <div>
                <h2 class="font-['Anton',sans-serif] text-xl uppercase tracking-wide text-b-ink">
                  New Error Group
                </h2>
                <p class="text-xs font-bold uppercase tracking-widest text-b-ink/50">
                  Create a new RPC error classification rule
                </p>
              </div>
            </div>
          </div>

          <div class="p-6">
            <form onSubmit={handleSubmit} class="flex flex-col gap-6">
              <div class="flex flex-col gap-2">
                <label
                  for="new-group-name"
                  class="text-xs font-bold uppercase tracking-widest text-b-ink/70"
                >
                  Name
                </label>
                <input
                  id="new-group-name"
                  type="text"
                  required
                  pattern={nameValidationPattern}
                  value={name()}
                  onInput={(e) => {
                    setName(e.currentTarget.value);
                    setFormError(null);
                  }}
                  class="h-11 w-full border border-b-border bg-b-paper px-4 text-sm font-semibold text-b-ink placeholder:text-b-ink/25 outline-none focus-visible:border-b-accent/50 focus-visible:ring-2 focus-visible:ring-b-accent/20 hover:border-b-border-hover transition-all duration-200"
                  placeholder="CRITICAL_ERRORS"
                  title={nameValidationHint}
                  autocomplete="off"
                />
                <p class="text-xs font-semibold uppercase tracking-wider text-b-ink/40">
                  {nameValidationHint}
                </p>
              </div>

              <div class="flex flex-col gap-2">
                <label
                  for="new-group-action"
                  class="text-xs font-bold uppercase tracking-widest text-b-ink/70"
                >
                  Action
                </label>
                <select
                  id="new-group-action"
                  value={action()}
                  onChange={(e) => setAction(e.currentTarget.value)}
                  class="h-11 w-full border border-b-border bg-b-paper px-4 text-sm font-semibold text-b-ink outline-none focus-visible:border-b-accent/50 focus-visible:ring-2 focus-visible:ring-b-accent/20 hover:border-b-border-hover transition-all duration-200 appearance-none cursor-pointer"
                >
                  <For each={ACTION_OPTIONS}>
                    {(opt) => <option value={opt}>{opt}</option>}
                  </For>
                </select>
                <p class="text-xs font-semibold uppercase tracking-wider text-b-ink/40">
                  Transient: temporary degrade. SoftOverwhelmed: moderate
                  overload. HardOverwhelmed: severe failure.
                </p>
              </div>

              <Show when={formError()}>
                <p class="border border-red-500/40 bg-red-500/10 px-3 py-3 text-xs font-bold uppercase leading-snug text-red-400">
                  {formError()}
                </p>
              </Show>

              <div class="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <A
                  href="/errors"
                  class="btn btn-md btn-interactive btn-secondary text-center"
                >
                  Cancel
                </A>
                <button
                  type="submit"
                  disabled={loading()}
                  class="btn btn-md btn-interactive btn-disabled btn-primary"
                >
                  <Show when={loading()}>
                    <LoadingSpinner class="size-3.5 text-b-paper" />
                  </Show>
                  {loading() ? "Creating…" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
