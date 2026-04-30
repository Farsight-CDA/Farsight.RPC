import { createEffect, createMemo, createSignal, Show } from "solid-js";
import { useParams } from "@solidjs/router";
import LoadingSpinner from "../components/LoadingSpinner";
import StructureIcon from "../components/icons/StructureIcon";
import RpcStructureEditor from "../components/RpcStructureEditor";
import { useAuth } from "../lib/auth";
import { useReferenceData } from "../lib/reference-data";
import { useApplicationData } from "../lib/application-data";
import { normalizeRpcStructure } from "../lib/rpc-structure";

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

  const [draftStructure, setDraftStructure] = createSignal(
    applicationData.structure(),
  );
  const [structureError, setStructureError] = createSignal<string | null>(null);
  const [structureLoading, setStructureLoading] = createSignal(false);

  createEffect(() => {
    setDraftStructure(applicationData.structure());
  });

  const saveStructure = async () => {
    const token = auth.token;
    const app = application();
    if (!token || !app) return;

    setStructureError(null);
    setStructureLoading(true);
    try {
      const response = await fetch(`/api/Applications/${app.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: app.name,
          structure: normalizeRpcStructure(draftStructure()),
        }),
      });
      if (!response.ok) {
        throw new Error(
          await readErrorMessage(response, "Failed to update structure"),
        );
      }
      await applicationData.refreshApplication();
      setDraftStructure(applicationData.structure());
    } catch (err) {
      setStructureError(
        err instanceof Error ? err.message : "Failed to update structure",
      );
    } finally {
      setStructureLoading(false);
    }
  };

  return (
    <div class="flex flex-col gap-6">
      <section class="border border-b-border bg-b-field overflow-hidden">
        <div class="border-b border-b-border bg-b-paper/30 px-6 py-5">
          <div class="flex items-center gap-4">
            <div class="flex size-12 items-center justify-center border border-b-accent/30 bg-b-accent/10">
              <StructureIcon class="size-6 text-b-accent" />
            </div>
            <div>
              <h2 class="font-['Anton',sans-serif] text-2xl uppercase tracking-wide text-b-ink">
                RPC Structure
              </h2>
              <p class="mt-0.5 text-xs font-bold uppercase tracking-widest text-b-ink/50">
                Configure frontend validation requirements for each chain
              </p>
            </div>
          </div>
        </div>

        <div class="p-6">
          <RpcStructureEditor
            value={draftStructure()}
            disabled={structureLoading()}
            onChange={(value) => {
              setDraftStructure(value);
              setStructureError(null);
            }}
          />

          <Show when={structureError()}>
            <p class="mt-5 border border-red-500/40 bg-red-500/10 px-4 py-3 text-xs font-bold uppercase leading-snug text-red-400">
              {structureError()}
            </p>
          </Show>

          <div class="mt-6 flex items-center justify-end gap-3 border-t border-b-border pt-5">
            <Show when={structureLoading()}>
              <div class="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-b-ink/50">
                <LoadingSpinner class="size-3.5" />
                Saving...
              </div>
            </Show>
            <button
              type="button"
              disabled={structureLoading()}
              onClick={() => void saveStructure()}
              class="btn btn-md btn-interactive btn-disabled btn-primary"
            >
              Save Structure
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
