import { A, useParams, useLocation } from "@solidjs/router";
import { Show, createMemo, type ParentComponent } from "solid-js";
import { useReferenceData } from "../lib/reference-data";
import LoadingSpinner from "../components/LoadingSpinner";
import ArrowLeftIcon from "../components/icons/ArrowLeftIcon";
import ErrorGroupIcon from "../components/icons/ErrorGroupIcon";
import SettingsIcon from "../components/icons/SettingsIcon";

const ErrorGroupLayout: ParentComponent = (props) => {
  const params = useParams();
  const location = useLocation();
  const referenceData = useReferenceData();

  const groupId = () => params.groupId;
  const errorGroups = referenceData.errorGroups.data;
  const errorGroupsState = referenceData.errorGroups.state;

  const group = createMemo(
    () => errorGroups().find((g) => g.id === groupId()) ?? null,
  );

  const getActiveTab = () => {
    const path = location.pathname;
    if (path.includes("/matched")) return "matched";
    return "general";
  };

  return (
    <main class="flex flex-1 flex-col">
      <Show
        when={errorGroupsState() === "pending" || errorGroupsState() === "idle"}
      >
        <div class="flex flex-1 items-center justify-center">
          <div class="flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-b-ink/80">
            <LoadingSpinner class="size-5" />
            Loading error group…
          </div>
        </div>
      </Show>

      <Show
        when={errorGroupsState() !== "pending" && errorGroupsState() !== "idle"}
      >
        <Show
          when={group()}
          fallback={
            <div class="flex flex-1 flex-col items-center justify-center gap-3 py-24">
              <ErrorGroupIcon class="size-10 text-b-ink/20" />
              <p class="text-sm font-semibold uppercase tracking-wider text-b-ink/50">
                Error group not found.
              </p>
              <A
                href="/errors"
                class="btn btn-sm btn-interactive btn-primary"
              >
                Back to error groups
              </A>
            </div>
          }
        >
          <div class="border-b border-b-border bg-b-field/50 px-6 py-3">
            <div class="mx-auto max-w-3xl">
              <div class="flex flex-col gap-1.5">
                <div class="flex items-center gap-2">
                  <A
                    href="/errors"
                    class="group flex items-center gap-1.5 text-[0.65rem] font-bold uppercase tracking-widest text-b-ink/50 transition-colors hover:text-b-accent"
                  >
                    <ArrowLeftIcon class="size-3.5 transition-transform group-hover:-translate-x-1" />
                    Error Groups
                  </A>
                </div>
                <h1 class="font-['Anton',sans-serif] text-3xl uppercase leading-none tracking-wide text-b-ink">
                  {group()!.name}
                </h1>
                <div class="flex items-center border-b border-b-border/50">
                  <A
                    href={`/errors/${groupId()}/general`}
                    class={`flex items-center gap-1.5 px-4 py-2 text-[0.65rem] font-bold uppercase tracking-widest transition-all duration-200 ${
                      getActiveTab() === "general"
                        ? "border-b-2 border-b-accent bg-b-accent/5 text-b-accent"
                        : "text-b-ink/50 hover:text-b-ink hover:bg-b-ink/5"
                    }`}
                  >
                    <SettingsIcon class="size-3.5" />
                    General
                  </A>
                  <A
                    href={`/errors/${groupId()}/matched`}
                    class={`flex items-center gap-1.5 px-4 py-2 text-[0.65rem] font-bold uppercase tracking-widest transition-all duration-200 ${
                      getActiveTab() === "matched"
                        ? "border-b-2 border-b-accent bg-b-accent/5 text-b-accent"
                        : "text-b-ink/50 hover:text-b-ink hover:bg-b-ink/5"
                    }`}
                  >
                    <ErrorGroupIcon class="size-3.5" />
                    Matched Errors
                  </A>
                </div>
              </div>
            </div>
          </div>

          <div class="flex-1 px-6 py-4">
            <div class="mx-auto max-w-3xl">{props.children}</div>
          </div>
        </Show>
      </Show>
    </main>
  );
};

export default ErrorGroupLayout;
