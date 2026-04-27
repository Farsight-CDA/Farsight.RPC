import { A } from "@solidjs/router";
import { createSignal, For, Show, createMemo } from "solid-js";
import LoadingSpinner from "../components/LoadingSpinner";
import BackIcon from "../components/icons/BackIcon";
import ErrorGroupIcon from "../components/icons/ErrorGroupIcon";
import ArrowRightIcon from "../components/icons/ArrowRightIcon";
import SearchIcon from "../components/icons/SearchIcon";
import { useReferenceData } from "../lib/reference-data";
import { actionBadgeClass } from "../lib/error-groups";

export default function ErrorGroupsPage() {
  const referenceData = useReferenceData();

  const errorGroups = referenceData.errorGroups.data;
  const errorGroupsState = referenceData.errorGroups.state;
  const errorGroupsError = referenceData.errorGroups.error;

  const [searchQuery, setSearchQuery] = createSignal("");

  const filteredGroups = createMemo(() => {
    const groups = errorGroups() ?? [];
    const query = searchQuery().toLowerCase().trim();

    if (query) {
      return groups.filter(
        (group) =>
          group.name.toLowerCase().includes(query) ||
          group.errors.some((err) => err.toLowerCase().includes(query)),
      );
    }

    return groups;
  });

  const groupCount = createMemo(() => (errorGroups() ?? []).length);
  const filteredCount = createMemo(() => filteredGroups().length);

  return (
    <main class="flex flex-1 flex-col items-center gap-8 px-4 sm:px-6 py-12 sm:py-16">
      <div class="w-full max-w-6xl">
        <A
          href="/"
          class="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-b-ink/50 hover:text-b-accent transition-colors duration-200 mb-6"
        >
          <BackIcon class="size-3" />
          Back
        </A>

        <div class="border border-b-border bg-b-field shadow-[0_4px_30px_rgba(0,0,0,0.4)]">
          {/* Compact Header Section */}
          <div class="p-5 sm:p-8">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 class="font-['Anton',sans-serif] text-3xl sm:text-4xl uppercase leading-none text-b-ink">
                Error Groups
              </h2>
              <A
                href="/errors/new"
                class="btn btn-md btn-interactive btn-primary shrink-0 text-center"
              >
                Create
              </A>
            </div>

            {/* Search Bar */}
            <div class="mt-5 pt-5 border-t border-b-border">
              <div class="relative max-w-md">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <SearchIcon class="size-4 text-b-ink/40" />
                </div>
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery()}
                  onInput={(e) => setSearchQuery(e.currentTarget.value)}
                  class="w-full h-9 pl-9 pr-3 border border-b-border bg-b-paper text-sm font-semibold text-b-ink placeholder:text-b-ink/30 outline-none focus-visible:border-b-accent/50 focus-visible:ring-2 focus-visible:ring-b-accent/20 hover:border-b-border-hover transition-all duration-200"
                />
              </div>

              {/* Filter Status */}
              <div class="mt-3 text-xs font-semibold uppercase tracking-wider text-b-ink/40">
                <span>
                  Showing {filteredCount()} of {groupCount()}
                </span>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div class="px-5 pb-5 sm:px-8 sm:pb-8 pt-2">
            <Show when={errorGroupsState() === "refreshing"}>
              <div class="flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-b-ink/80 py-4">
                <LoadingSpinner class="size-4" />
                Updating error groups…
              </div>
            </Show>

            <Show when={errorGroupsError()}>
              <p class="border-4 border-red-500/50 bg-red-500/10 px-3 py-3 text-xs font-bold uppercase leading-snug text-red-400">
                {errorGroupsError()!.message}
              </p>
            </Show>

            <Show when={errorGroupsState() === "pending"}>
              <div class="flex items-center justify-center gap-3 py-16 text-sm font-semibold uppercase tracking-wider text-b-ink/80">
                <LoadingSpinner class="size-5" />
                Loading…
              </div>
            </Show>

            {/* Error Groups Grid */}
            <Show
              when={
                !errorGroupsError() &&
                (errorGroupsState() === "ready" ||
                  errorGroupsState() === "refreshing") &&
                filteredGroups().length > 0
              }
            >
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <For each={filteredGroups()}>
                  {(group) => {
                    const errorCount = () => group.errors.length;
                    return (
                      <A
                        href={`/errors/${group.id}`}
                        class="group relative border border-b-border bg-b-paper p-5 transition-all duration-200 hover:border-b-accent/40 hover:bg-b-field hover:shadow-[0_4px_20px_rgba(255,87,34,0.12)] hover:-translate-y-0.5 outline-none focus-visible:ring-2 focus-visible:ring-b-accent/30 overflow-hidden"
                      >
                        {/* Decorative Corner Accent */}
                        <div class="absolute top-0 right-0 w-12 h-12 bg-gradient-to-bl from-b-accent/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

                        {/* Group Name */}
                        <h3
                          class="font-['Anton',sans-serif] text-xl uppercase tracking-wide text-b-ink group-hover:text-b-accent transition-colors duration-200 line-clamp-1"
                          title={group.name}
                        >
                          {group.name}
                        </h3>

                        {/* Action Badge */}
                        <div class="absolute top-5 right-5">
                          <span
                            class={`inline-flex items-center border px-3 py-1 text-[0.65rem] font-bold uppercase tracking-wider ${actionBadgeClass(
                              group.action,
                            )}`}
                          >
                            {group.action}
                          </span>
                        </div>

                        {/* Stats Row */}
                        <div class="mt-4 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-b-ink/40 group-hover:text-b-accent/60 transition-colors duration-200">
                          <ErrorGroupIcon class="size-3.5" />
                          <span>
                            {errorCount()} error
                            {errorCount() === 1 ? "" : "s"}
                          </span>
                        </div>

                        {/* Arrow Indicator */}
                        <div class="absolute bottom-5 right-5 opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-x-2 group-hover:translate-x-0">
                          <ArrowRightIcon class="size-5 text-b-accent" />
                        </div>
                      </A>
                    );
                  }}
                </For>
              </div>
            </Show>

            {/* Empty State */}
            <Show
              when={
                !errorGroupsError() &&
                errorGroupsState() === "ready" &&
                (errorGroups() ?? []).length === 0
              }
            >
              <div class="flex flex-col items-center justify-center gap-3 py-12 border border-dashed border-b-border/50 bg-b-paper/20">
                <ErrorGroupIcon class="size-6 text-b-ink/30" />
                <p class="text-sm font-semibold uppercase tracking-wider text-b-ink/50">
                  No error groups defined.
                </p>
                <A
                  href="/errors/new"
                  class="btn btn-sm btn-interactive btn-primary"
                >
                  Create group
                </A>
              </div>
            </Show>

            {/* No Search Results */}
            <Show
              when={
                !errorGroupsError() &&
                errorGroupsState() === "ready" &&
                (errorGroups() ?? []).length > 0 &&
                filteredGroups().length === 0
              }
            >
              <div class="flex flex-col items-center justify-center gap-2 py-12 border border-dashed border-b-border/50 bg-b-paper/20">
                <SearchIcon class="size-5 text-b-ink/30 mb-1" />
                <p class="text-sm font-semibold uppercase tracking-wider text-b-ink/50">
                  No matches for "{searchQuery()}"
                </p>
                <button
                  onClick={() => setSearchQuery("")}
                  class="text-xs font-bold uppercase tracking-wider text-b-accent hover:underline"
                >
                  Clear
                </button>
              </div>
            </Show>
          </div>
        </div>
      </div>
    </main>
  );
}
