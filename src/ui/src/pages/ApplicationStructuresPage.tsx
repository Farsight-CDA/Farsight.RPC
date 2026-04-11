import { createMemo, createSignal, For, Show } from "solid-js";
import { useParams } from "@solidjs/router";
import LoadingSpinner from "../components/LoadingSpinner";
import StructureIcon from "../components/icons/StructureIcon";
import { useAuth } from "../lib/auth";
import { useReferenceData } from "../lib/reference-data";
import { useApplicationData } from "../lib/application-data";

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
  return fallback;
}

export default function ApplicationStructuresPage() {
  const auth = useAuth();
  const referenceData = useReferenceData();
  const applicationData = useApplicationData();
  const params = useParams();
  const applicationId = () => params.applicationId;

  const applications = referenceData.applications.data;

  const application = createMemo(
    () => applications().find((app) => app.id === applicationId()) ?? null,
  );

  const rpcStructures = referenceData.rpcStructures.data;
  const appStructures = applicationData.structures.data;

  const [structuresError, setStructuresError] = createSignal<string | null>(
    null,
  );
  const [structuresLoading, setStructuresLoading] = createSignal(false);

  const isStructureSelected = (structure: string) =>
    appStructures().includes(structure);

  const toggleStructure = async (structure: string) => {
    const token = auth.token;
    const app = application();
    if (!token || !app) return;

    const current = appStructures();
    const next = current.includes(structure)
      ? current.filter((s) => s !== structure)
      : [...current, structure];

    setStructuresError(null);
    setStructuresLoading(true);
    try {
      const response = await fetch(`/api/Applications/${app.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: app.name, structures: next }),
      });
      if (!response.ok) {
        throw new Error(
          await readErrorMessage(response, "Failed to update structures"),
        );
      }
      await applicationData.refreshApplication();
    } catch (err) {
      setStructuresError(
        err instanceof Error ? err.message : "Failed to update structures",
      );
    } finally {
      setStructuresLoading(false);
    }
  };

  return (
    <div class="flex flex-col gap-6">
      <section class="border border-b-border bg-b-field overflow-hidden">
        <div class="border-b border-b-border bg-b-paper/30 px-6 py-4">
          <div class="flex items-center gap-3">
            <div class="flex size-10 items-center justify-center border border-b-accent/30 bg-b-accent/10">
              <StructureIcon class="size-5 text-b-accent" />
            </div>
            <div>
              <h2 class="font-['Anton',sans-serif] text-xl uppercase tracking-wide text-b-ink">
                Supported Structures
              </h2>
              <p class="text-xs font-bold uppercase tracking-widest text-b-ink/50">
                Select optional structure requirements for this application
              </p>
            </div>
          </div>
        </div>

        <div class="p-6">
          <div class="flex flex-col gap-3">
          <For each={rpcStructures()}>
            {(def) => {
              const typeEntries = () =>
                Object.entries(def.requiredRpcTypes ?? {});
              return (
                <button
                  type="button"
                  disabled={structuresLoading()}
                  onClick={() => void toggleStructure(def.structure)}
                  class={`flex items-center gap-4 border px-4 py-4 text-left transition-all duration-200 ${
                    isStructureSelected(def.structure)
                      ? "border-b-accent/50 bg-b-accent/10"
                      : "border-b-border bg-b-paper/20 hover:border-b-border-hover"
                  } ${structuresLoading() ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                >
                  <div
                    class={`flex size-5 shrink-0 items-center justify-center border transition-all duration-200 ${
                      isStructureSelected(def.structure)
                        ? "border-b-accent bg-b-accent"
                        : "border-b-ink/30 bg-b-paper"
                    }`}
                  >
                    <Show when={isStructureSelected(def.structure)}>
                      <svg
                        class="size-3 text-b-paper"
                        viewBox="0 0 12 12"
                        fill="none"
                      >
                        <path
                          d="M2 6l3 3 5-5"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        />
                      </svg>
                    </Show>
                  </div>
                  <div class="min-w-0 flex-1">
                    <p class="font-['Anton',sans-serif] text-base uppercase tracking-wide text-b-ink">
                      {def.structure}
                    </p>
                    <div class="mt-1 flex flex-wrap gap-2">
                      <For each={typeEntries()}>
                        {([type, count]) => (
                          <span
                            class={`inline-flex items-center border px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider ${
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

        <Show when={structuresError()}>
          <p class="mt-4 border border-red-500/40 bg-red-500/10 px-3 py-3 text-xs font-bold uppercase leading-snug text-red-400">
            {structuresError()}
          </p>
        </Show>

        <Show when={structuresLoading()}>
          <div class="mt-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-b-ink/50">
            <LoadingSpinner class="size-3.5" />
            Saving…
          </div>
        </Show>
      </div>
      </section>
    </div>
  );
}
