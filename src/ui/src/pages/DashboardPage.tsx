import { A } from "@solidjs/router";
import { createResource, For, Show } from "solid-js";
import { useAuth } from "../lib/auth";

type ApplicationSummary = {
  id: string;
  name: string;
  tracingCount: number;
  realtimeCount: number;
  archiveCount: number;
};

export default function DashboardPage() {
  const auth = useAuth();

  const [applications] = createResource(
    () => auth.token,
    async (token) => {
      if (!token) return [] as ApplicationSummary[];
      const response = await fetch("/api/applications", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        throw new Error("Failed to load applications");
      }
      return response.json() as Promise<ApplicationSummary[]>;
    },
  );

  return (
    <main class="flex flex-1 flex-col items-center gap-8 px-6 py-16">
      <div class="w-full max-w-2xl border-4 border-[var(--color-b-ink)] bg-b-field p-10 shadow-[10px_10px_0_0_var(--color-b-ink)]">
        <p class="mb-3 text-xs font-bold uppercase tracking-[0.4em] text-b-ink">Applications</p>
        <h2 class="font-['Anton',sans-serif] text-5xl uppercase leading-none text-b-ink">Choose one</h2>
        <div class="mt-6 h-1 w-full bg-b-ink" />

        <Show when={applications.error}>
          <p class="mt-8 border-4 border-[var(--color-b-accent)] bg-b-paper px-3 py-3 text-xs font-bold uppercase leading-snug text-b-accent">
            {applications.error.message}
          </p>
        </Show>

        <Show when={applications.loading}>
          <p class="mt-8 text-sm font-semibold uppercase tracking-wider text-b-ink/80">Loading…</p>
        </Show>

        <Show when={!applications.loading && !applications.error && (applications() ?? []).length > 0}>
          <ul class="mt-8 flex flex-col gap-4">
            <For each={applications()}>
              {(app) => (
                <li>
                  <A
                    href={`/applications/${app.id}`}
                    class="block w-full border-4 border-[var(--color-b-ink)] bg-b-paper px-4 py-4 text-left shadow-[4px_4px_0_0_var(--color-b-ink)] outline-none transition-transform hover:-translate-x-px hover:-translate-y-px hover:shadow-[6px_6px_0_0_var(--color-b-ink)] focus-visible:ring-4 focus-visible:ring-b-accent active:translate-x-0 active:translate-y-0 active:shadow-[2px_2px_0_0_var(--color-b-ink)]"
                  >
                    <span class="font-['Anton',sans-serif] text-2xl uppercase tracking-wide text-b-ink">{app.name}</span>
                    <p class="mt-2 text-xs font-bold uppercase tracking-widest text-b-ink/70">
                      Tracing {app.tracingCount} · Realtime {app.realtimeCount} · Archive {app.archiveCount}
                    </p>
                  </A>
                </li>
              )}
            </For>
          </ul>
        </Show>

        <Show when={!applications.loading && !applications.error && (applications() ?? []).length === 0}>
          <p class="mt-8 text-sm font-semibold uppercase tracking-wider text-b-ink/80">No applications available.</p>
        </Show>
      </div>
    </main>
  );
}
