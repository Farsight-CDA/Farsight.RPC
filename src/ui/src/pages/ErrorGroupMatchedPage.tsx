import { useParams } from "@solidjs/router";
import { createMemo, createSignal, For, Show } from "solid-js";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorGroupIcon from "../components/icons/ErrorGroupIcon";
import PlusIcon from "../components/icons/PlusIcon";
import TrashIcon from "../components/icons/TrashIcon";
import { useAuth } from "../lib/auth";
import { useReferenceData } from "../lib/reference-data";
import { readErrorMessage, validateErrorValue } from "../lib/error-groups";

export default function ErrorGroupMatchedPage() {
  const auth = useAuth();
  const referenceData = useReferenceData();
  const params = useParams();
  const groupId = () => params.groupId;

  const errorGroups = referenceData.errorGroups.data;
  const group = createMemo(
    () => errorGroups().find((g) => g.id === groupId())!,
  );

  const [newError, setNewError] = createSignal("");
  const [formError, setFormError] = createSignal<string | null>(null);
  const [loading, setLoading] = createSignal(false);

  const handleAddError = async () => {
    const token = auth.token;
    const g = group();
    if (!token || !g) return;
    if (loading()) return;

    const value = newError().trim();
    if (!value) {
      setFormError("Error value is required.");
      return;
    }

    const validation = validateErrorValue(value);
    if (validation) {
      setFormError(validation);
      return;
    }

    if (g.errors.includes(value)) {
      setFormError("This error pattern already exists.");
      return;
    }

    setFormError(null);
    setLoading(true);
    try {
      const response = await fetch(`/api/RpcErrorGroups/${g.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: g.name,
          action: g.action,
          errors: [...g.errors, value],
        }),
      });
      if (!response.ok) {
        throw new Error(
          await readErrorMessage(response, "Failed to add error pattern"),
        );
      }
      setNewError("");
      await referenceData.refreshErrorGroups();
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Failed to add error pattern",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveError = async (index: number) => {
    const token = auth.token;
    const g = group();
    if (!token || !g) return;
    if (loading()) return;

    const nextErrors = g.errors.filter((_, i) => i !== index);

    setFormError(null);
    setLoading(true);
    try {
      const response = await fetch(`/api/RpcErrorGroups/${g.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: g.name,
          action: g.action,
          errors: nextErrors,
        }),
      });
      if (!response.ok) {
        throw new Error(
          await readErrorMessage(response, "Failed to remove error pattern"),
        );
      }
      await referenceData.refreshErrorGroups();
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Failed to remove error pattern",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section class="border border-b-border bg-b-field overflow-hidden">
      <div class="border-b border-b-border bg-b-paper/30 px-6 py-4">
        <div class="flex items-center gap-3">
          <div class="flex size-10 items-center justify-center border border-b-accent/30 bg-b-accent/10">
            <ErrorGroupIcon class="size-5 text-b-accent" />
          </div>
          <div>
            <h2 class="font-['Anton',sans-serif] text-xl uppercase tracking-wide text-b-ink">
              Matched Errors
            </h2>
            <p class="text-xs font-bold uppercase tracking-widest text-b-ink/50">
              Configure error patterns for this group
            </p>
          </div>
        </div>
      </div>

      <div class="p-6">
        <div class="flex flex-col gap-2 mb-6">
          <label class="text-xs font-bold uppercase tracking-widest text-b-ink/70">
            Add Error Pattern
          </label>
          <div class="flex items-center gap-2">
            <input
              type="text"
              value={newError()}
              onInput={(e) => {
                setNewError(e.currentTarget.value);
                setFormError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void handleAddError();
                }
              }}
              disabled={loading()}
              class="h-10 w-full border border-b-border bg-b-paper px-3 text-sm font-semibold text-b-ink placeholder:text-b-ink/25 outline-none focus-visible:border-b-accent/50 focus-visible:ring-2 focus-visible:ring-b-accent/20 hover:border-b-border-hover transition-all duration-200"
              placeholder="Enter error pattern..."
            />
            <button
              type="button"
              onClick={() => void handleAddError()}
              disabled={loading()}
              class="btn btn-sm btn-interactive btn-disabled btn-secondary shrink-0"
            >
              <PlusIcon class="size-3" />
              Add
            </button>
          </div>
          <Show when={formError()}>
            <p class="border border-red-500/40 bg-red-500/10 px-3 py-3 text-xs font-bold uppercase leading-snug text-red-400">
              {formError()}
            </p>
          </Show>
        </div>

        <Show
          when={group().errors.length > 0}
          fallback={
            <div class="flex flex-col items-center justify-center gap-3 py-8 border border-dashed border-b-border/50 bg-b-paper/20">
              <ErrorGroupIcon class="size-8 text-b-ink/20" />
              <p class="text-sm font-semibold uppercase tracking-wider text-b-ink/50">
                No error patterns configured.
              </p>
              <p class="text-xs font-semibold uppercase tracking-wider text-b-ink/30">
                Add your first error pattern above.
              </p>
            </div>
          }
        >
          <div class="flex flex-col gap-2">
            <p class="text-xs font-bold uppercase tracking-widest text-b-ink/50 mb-1">
              {group().errors.length} pattern
              {group().errors.length === 1 ? "" : "s"}
            </p>
            <For each={group().errors}>
              {(err, i) => (
                <div class="flex items-center justify-between gap-4 border border-b-border bg-b-paper/40 px-4 py-3">
                  <span class="text-sm font-semibold text-b-ink break-all">
                    {err}
                  </span>
                  <button
                    type="button"
                    onClick={() => void handleRemoveError(i())}
                    disabled={loading()}
                    class="btn btn-sm btn-interactive btn-disabled btn-danger shrink-0"
                    title="Remove error pattern"
                  >
                    <TrashIcon class="size-3" />
                  </button>
                </div>
              )}
            </For>
          </div>
        </Show>
      </div>
    </section>
  );
}
