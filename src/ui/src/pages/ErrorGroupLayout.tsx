import { A, useParams, useLocation } from "@solidjs/router";
import { Show, createMemo, type ParentComponent } from "solid-js";
import { useReferenceData } from "../lib/reference-data";
import { DETAIL_PAGE_MAX_WIDTH } from "../lib/layout";
import LoadingSpinner from "../components/LoadingSpinner";
import DetailPageHeader from "../components/DetailPageHeader";
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
          <DetailPageHeader
            backHref="/errors"
            backLabel="Error Groups"
            title={<>{group()!.name}</>}
            tabs={[
              {
                href: `/errors/${groupId()}/general`,
                label: "General",
                icon: <SettingsIcon class="size-3.5" />,
                active: getActiveTab() === "general",
              },
              {
                href: `/errors/${groupId()}/matched`,
                label: "Matched Errors",
                icon: <ErrorGroupIcon class="size-3.5" />,
                active: getActiveTab() === "matched",
              },
            ]}
          />

          <div class="flex-1 px-6 py-4">
            <div class={`mx-auto ${DETAIL_PAGE_MAX_WIDTH}`}>{props.children}</div>
          </div>
        </Show>
      </Show>
    </main>
  );
};

export default ErrorGroupLayout;
