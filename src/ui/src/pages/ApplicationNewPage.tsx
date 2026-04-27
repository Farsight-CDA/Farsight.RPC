import { A, useNavigate } from "@solidjs/router";
import { createSignal, For, Show } from "solid-js";
import LoadingSpinner from "../components/LoadingSpinner";
import BackIcon from "../components/icons/BackIcon";
import CheckmarkIcon from "../components/icons/CheckmarkIcon";
import ListIcon from "../components/icons/ListIcon";
import { useAuth } from "../lib/auth";
import {
  nameValidationHint,
  nameValidationPattern,
  validateName,
} from "../lib/name-validation";
import { useReferenceData } from "../lib/reference-data";

async function readErrorMessage(
  response: Response,
  fallback: string,
): Promise<string> {
  try {
    const data = (await response.json()) as {
      message?: string;
      errors?: Record<string, string[]>;
    };
    if (data.message && data.message !== "One or more errors occurred!")
      return data.message;
    const first = data.errors && Object.values(data.errors).flat()[0];
    if (first) return first;
  } catch {}
  if (response.status === 409)
    return "An application with this name already exists.";
  return fallback;
}

export default function ApplicationNewPage() {
  const auth = useAuth();
  const referenceData = useReferenceData();
  const navigate = useNavigate();

  const rpcStructures = referenceData.rpcStructures.data;

  const [name, setName] = createSignal("");
  const [structures, setStructures] = createSignal<string[]>([]);
  const [formError, setFormError] = createSignal<string | null>(null);
  const [loading, setLoading] = createSignal(false);

  const isStructureSelected = (structure: string) =>
    structures().includes(structure);

  const toggleStructure = (structure: string) => {
    setStructures((current) =>
      current.includes(structure)
        ? current.filter((value) => value !== structure)
        : [...current, structure],
    );
    setFormError(null);
  };

  const handleSubmit = async (e: SubmitEvent) => {
    e.preventDefault();
    const token = auth.token;
    if (!token) return;

    const appName = name();
    const validationError = validateName(appName);
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setFormError(null);
    setLoading(true);
    try {
      const response = await fetch("/api/Applications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: appName, structures: structures() }),
      });
      if (!response.ok) {
        throw new Error(
          await readErrorMessage(response, "Failed to create application"),
        );
      }
      await referenceData.refreshApplications();
      const created = referenceData.applications
        .data()
        .find((a) => a.name === appName);
      if (created) {
        navigate(`/applications/${created.id}`);
      } else {
        navigate("/applications");
      }
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Failed to create application",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main class="flex flex-1 flex-col items-center gap-8 px-4 sm:px-6 py-8 sm:py-12">
      <div class="w-full max-w-3xl">
        <A
          href="/applications"
          class="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-b-ink/50 hover:text-b-accent transition-colors duration-200 mb-6"
        >
          <BackIcon class="size-3" />
          Back
        </A>

        <section class="border border-b-border bg-b-field overflow-hidden">
          <div class="border-b border-b-border bg-b-paper/30 px-6 py-4">
            <div class="flex items-center gap-3">
              <div class="flex size-10 items-center justify-center border border-b-accent/30 bg-b-accent/10">
                <ListIcon class="size-5 text-b-accent" />
              </div>
              <div>
                <h2 class="font-['Anton',sans-serif] text-xl uppercase tracking-wide text-b-ink">
                  New Application
                </h2>
                <p class="text-xs font-bold uppercase tracking-widest text-b-ink/50">
                  Create a new RPC consumer application
                </p>
              </div>
            </div>
          </div>

          <div class="p-6">
            <form onSubmit={handleSubmit} class="flex flex-col gap-6">
              <div class="flex flex-col gap-2">
                <label
                  for="new-app-name"
                  class="text-xs font-bold uppercase tracking-widest text-b-ink/70"
                >
                  Name
                </label>
                <input
                  id="new-app-name"
                  type="text"
                  required
                  pattern={nameValidationPattern}
                  value={name()}
                  onInput={(e) => {
                    setName(e.currentTarget.value);
                    setFormError(null);
                  }}
                  class="h-11 w-full border border-b-border bg-b-paper px-4 text-sm font-semibold text-b-ink placeholder:text-b-ink/25 outline-none focus-visible:border-b-accent/50 focus-visible:ring-2 focus-visible:ring-b-accent/20 hover:border-b-border-hover transition-all duration-200"
                  placeholder="MY APPLICATION"
                  title={nameValidationHint}
                  autocomplete="off"
                />
                <p class="text-xs font-semibold uppercase tracking-wider text-b-ink/40">
                  {nameValidationHint}
                </p>
              </div>

              <div class="flex flex-col gap-3">
                <div>
                  <p class="text-xs font-bold uppercase tracking-widest text-b-ink/70">
                    Supported Structures (Optional)
                  </p>
                </div>

                <div class="flex flex-col gap-3">
                  <For each={rpcStructures()}>
                    {(def) => {
                      const typeEntries = () =>
                        Object.entries(def.requiredRpcTypes);
                      return (
                        <button
                          type="button"
                          disabled={loading()}
                          onClick={() => toggleStructure(def.structure)}
                          class={`flex items-center gap-4 border px-4 py-4 text-left transition-all duration-200 ${
                            isStructureSelected(def.structure)
                              ? "border-b-accent/50 bg-b-accent/10"
                              : "border-b-border bg-b-paper/20 hover:border-b-border-hover"
                          } ${loading() ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                        >
                          <div
                            class={`flex size-5 shrink-0 items-center justify-center border transition-all duration-200 ${
                              isStructureSelected(def.structure)
                                ? "border-b-accent bg-b-accent"
                                : "border-b-ink/30 bg-b-paper"
                            }`}
                          >
                            <Show when={isStructureSelected(def.structure)}>
                              <CheckmarkIcon class="size-3 text-b-paper" />
                            </Show>
                          </div>
                          <div class="min-w-0 flex-1">
                            <p class="font-['Anton',sans-serif] text-base tracking-wide text-b-ink">
                              {def.displayName}
                            </p>
                            <div class="mt-1 flex flex-wrap gap-2">
                              <For each={typeEntries()}>
                                {([type, count]) => (
                                  <span
                                    class={`inline-flex items-center border px-2 py-0.5 text-[0.6rem] font-bold tracking-wider ${
                                      type === "Realtime"
                                        ? "text-green-400 border-green-500/30 bg-green-500/10"
                                        : type === "Archive"
                                          ? "text-blue-400 border-blue-500/30 bg-blue-500/10"
                                          : "text-purple-400 border-purple-500/30 bg-purple-500/10"
                                    }`}
                                  >
                                    {count}x {type}
                                  </span>
                                )}
                              </For>
                            </div>
                          </div>
                        </button>
                      );
                    }}
                  </For>
                </div>
              </div>

              <Show when={formError()}>
                <p class="border border-red-500/40 bg-red-500/10 px-3 py-3 text-xs font-bold uppercase leading-snug text-red-400">
                  {formError()}
                </p>
              </Show>

              <div class="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <A
                  href="/applications"
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
