export default function DashboardPage() {
  return (
    <main class="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-16">
      <div class="max-w-xl border-4 border-[var(--color-b-ink)] bg-b-field p-10 text-center shadow-[10px_10px_0_0_var(--color-b-ink)]">
        <p class="mb-3 text-xs font-bold uppercase tracking-[0.4em] text-b-ink">Status</p>
        <h2 class="font-['Anton',sans-serif] text-6xl uppercase leading-none text-b-ink">Welcome</h2>
        <div class="mt-6 h-1 w-full bg-b-ink" />
        <p class="mt-6 text-sm font-semibold uppercase tracking-wider text-b-ink/80">
          No content yet. System idle.
        </p>
      </div>
    </main>
  );
}
