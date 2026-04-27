import { A, useNavigate } from "@solidjs/router";
import { For, Show, createMemo, type ParentComponent } from "solid-js";
import { useReferenceData } from "../lib/reference-data";
import { useParams, useLocation } from "@solidjs/router";
import LoadingSpinner from "../components/LoadingSpinner";
import ArrowLeftIcon from "../components/icons/ArrowLeftIcon";
import RpcIcon from "../components/icons/RpcIcon";
import KeyIcon from "../components/icons/KeyIcon";
import SettingsIcon from "../components/icons/SettingsIcon";
import ProviderIcon from "../components/icons/ProviderIcon";
import StructureIcon from "../components/icons/StructureIcon";
import EnvironmentIcon from "../components/icons/EnvironmentIcon";
import ChevronDownIcon from "../components/icons/ChevronDownIcon";
import { useEnvironment } from "../lib/environment-context";

const ApplicationLayoutContent: ParentComponent = (props) => {
  const referenceData = useReferenceData();
  const navigate = useNavigate();
  const params = useParams();
  const location = useLocation();
  const applicationId = () => params.applicationId;
  const environment = useEnvironment();

  const applications = referenceData.applications.data;
  const applicationsState = referenceData.applications.state;
  const applicationsError = referenceData.applications.error;

  const application = createMemo(
    () => applications().find((app) => app.id === applicationId()) ?? null,
  );

  const getActiveTab = () => {
    const path = location.pathname;
    if (path.includes("/api-keys")) return "api-keys";
    if (path.includes("/structures")) return "structures";
    if (path.includes("/environments")) return "environments";
    if (path.includes("/general")) return "general";
    if (path.includes("/providers")) return "providers";
    return "rpcs";
  };

  const isRpcsTab = () => getActiveTab() === "rpcs";

  return (
    <main class="flex flex-1 flex-col">
      <div class="border-b border-b-border bg-b-field/50 px-6 py-3">
        <div class="mx-auto max-w-7xl">
          <Show when={applicationsState() === "pending"}>
            <div class="flex items-center gap-3 text-sm font-semibold uppercase tracking-wider text-b-ink/70">
              <LoadingSpinner class="size-5" />
              Loading application…
            </div>
          </Show>

          <Show when={applicationsError()}>
            <p class="border-4 border-red-500/50 bg-red-500/10 px-3 py-3 text-xs font-bold uppercase leading-snug text-red-400">
              {applicationsError()!.message}
            </p>
          </Show>

          <Show when={application() && applicationsState() === "ready"}>
            <div class="flex flex-col gap-1.5">
              {/* Name row with breadcrumb and app name */}
              <div class="flex items-center gap-2">
                <button
                  onClick={() => navigate("/applications")}
                  class="group flex items-center gap-1.5 text-[0.65rem] font-bold uppercase tracking-widest text-b-ink/50 transition-colors hover:text-b-accent"
                >
                  <ArrowLeftIcon class="size-3.5 transition-transform group-hover:-translate-x-1" />
                  Applications
                </button>
                <h1 class="font-['Anton',sans-serif] text-3xl uppercase leading-none tracking-wide text-b-ink">
                  {application()?.name}
                </h1>
              </div>

              {/* Tab row with optional environment selector */}
              <div class="flex items-center justify-between border-b border-b-border/50">
                <div class="flex">
                  <A
                    href={`/applications/${applicationId()}/general`}
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
                    href={`/applications/${applicationId()}/environments`}
                    class={`flex items-center gap-1.5 px-4 py-2 text-[0.65rem] font-bold uppercase tracking-widest transition-all duration-200 ${
                      getActiveTab() === "environments"
                        ? "border-b-2 border-b-accent bg-b-accent/5 text-b-accent"
                        : "text-b-ink/50 hover:text-b-ink hover:bg-b-ink/5"
                    }`}
                  >
                    <EnvironmentIcon class="size-3.5" />
                    Environments
                  </A>
                  <A
                    href={`/applications/${applicationId()}/providers`}
                    class={`flex items-center gap-1.5 px-4 py-2 text-[0.65rem] font-bold uppercase tracking-widest transition-all duration-200 ${
                      getActiveTab() === "providers"
                        ? "border-b-2 border-b-accent bg-b-accent/5 text-b-accent"
                        : "text-b-ink/50 hover:text-b-ink hover:bg-b-ink/5"
                    }`}
                  >
                    <ProviderIcon class="size-3.5" />
                    Providers
                  </A>
                  <A
                    href={`/applications/${applicationId()}/rpcs`}
                    class={`flex items-center gap-1.5 px-4 py-2 text-[0.65rem] font-bold uppercase tracking-widest transition-all duration-200 ${
                      getActiveTab() === "rpcs"
                        ? "border-b-2 border-b-accent bg-b-accent/5 text-b-accent"
                        : "text-b-ink/50 hover:text-b-ink hover:bg-b-ink/5"
                    }`}
                  >
                    <RpcIcon class="size-3.5" />
                    RPCs
                  </A>
                  <A
                    href={`/applications/${applicationId()}/api-keys`}
                    class={`flex items-center gap-1.5 px-4 py-2 text-[0.65rem] font-bold uppercase tracking-widest transition-all duration-200 ${
                      getActiveTab() === "api-keys"
                        ? "border-b-2 border-b-accent bg-b-accent/5 text-b-accent"
                        : "text-b-ink/50 hover:text-b-ink hover:bg-b-ink/5"
                    }`}
                  >
                    <KeyIcon class="size-3.5" />
                    API Keys
                  </A>
                  <A
                    href={`/applications/${applicationId()}/structures`}
                    class={`flex items-center gap-1.5 px-4 py-2 text-[0.65rem] font-bold uppercase tracking-widest transition-all duration-200 ${
                      getActiveTab() === "structures"
                        ? "border-b-2 border-b-accent bg-b-accent/5 text-b-accent"
                        : "text-b-ink/50 hover:text-b-ink hover:bg-b-ink/5"
                    }`}
                  >
                    <StructureIcon class="size-3.5" />
                    Structures
                  </A>
                </div>

                {/* Environment selector - only shown on RPCs tab */}
                <Show when={isRpcsTab()}>
                  <div class="relative">
                    <Show when={environment.environmentsState() === "pending"}>
                      <div class="flex h-9 items-center gap-2 border border-b-border bg-b-field px-3 w-48">
                        <LoadingSpinner class="size-3" />
                        <span class="text-[0.65rem] font-bold uppercase tracking-widest text-b-ink/50">
                          Loading…
                        </span>
                      </div>
                    </Show>
                    <Show when={environment.environmentsState() === "errored"}>
                      <p class="border border-red-500/40 bg-red-500/10 px-3 py-2 text-[0.65rem] font-bold uppercase text-red-400 w-48">
                        Error
                      </p>
                    </Show>
                    <Show
                      when={
                        environment.environmentsState() === "ready" &&
                        environment.environments().length > 0
                      }
                    >
                      <select
                        id="environment-select"
                        value={environment.selectedEnvironmentId()}
                        onChange={(e) =>
                          environment.setSelectedEnvironmentId(
                            e.currentTarget.value || undefined,
                          )
                        }
                        class="h-9 w-48 appearance-none border border-b-border bg-b-field px-3 pr-8 text-[0.65rem] font-bold uppercase tracking-widest text-b-ink outline-none focus-visible:border-b-accent/50 focus-visible:ring-2 focus-visible:ring-b-accent/20 hover:border-b-border-hover transition-all duration-200 cursor-pointer"
                      >
                        <For each={environment.environments()}>
                          {(env) => (
                            <option value={env.id} class="bg-b-field">
                              {env.name}
                            </option>
                          )}
                        </For>
                      </select>
                      <div class="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2">
                        <ChevronDownIcon class="size-4 text-b-ink/50" />
                      </div>
                    </Show>
                    <Show
                      when={
                        environment.environmentsState() === "ready" &&
                        environment.environments().length === 0
                      }
                    >
                      <div class="flex h-9 items-center border border-b-border bg-b-field px-3 w-48">
                        <span class="text-[0.65rem] font-bold uppercase tracking-widest text-b-ink/50">
                          No environments
                        </span>
                      </div>
                    </Show>
                  </div>
                </Show>
              </div>
            </div>
          </Show>
        </div>
      </div>

      <div class="flex-1 px-6 py-4">
        <div class="mx-auto max-w-7xl">{props.children}</div>
      </div>
    </main>
  );
};

const ApplicationLayout: ParentComponent = (props) => {
  return <ApplicationLayoutContent>{props.children}</ApplicationLayoutContent>;
};

export default ApplicationLayout;
