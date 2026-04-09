import { A, useNavigate } from "@solidjs/router";
import { Show, createMemo, type ParentComponent } from "solid-js";
import { useReferenceData } from "../lib/reference-data";
import { useParams, useLocation } from "@solidjs/router";
import LoadingSpinner from "../components/LoadingSpinner";
import ArrowLeftIcon from "../components/icons/ArrowLeftIcon";
import RpcIcon from "../components/icons/RpcIcon";
import KeyIcon from "../components/icons/KeyIcon";
import SettingsIcon from "../components/icons/SettingsIcon";
import ProviderIcon from "../components/icons/ProviderIcon";

const ApplicationLayout: ParentComponent = (props) => {
  const referenceData = useReferenceData();
  const navigate = useNavigate();
  const params = useParams();
  const location = useLocation();
  const applicationId = () => params.applicationId;

  const applications = referenceData.applications.data;
  const applicationsState = referenceData.applications.state;
  const applicationsError = referenceData.applications.error;

  const application = createMemo(
    () => applications().find((app) => app.id === applicationId()) ?? null,
  );

  const getActiveTab = () => {
    const path = location.pathname;
    if (path.includes("/api-keys")) return "api-keys";
    if (path.includes("/general")) return "general";
    if (path.includes("/providers")) return "providers";
    return "rpcs";
  };

  return (
    <main class="flex flex-1 flex-col">
      <div class="border-b border-b-border bg-b-field/50 px-6 py-4">
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
            <div class="flex flex-col gap-3">
              <button
                onClick={() => navigate("/")}
                class="group flex items-center gap-1.5 self-start text-[0.65rem] font-bold uppercase tracking-widest text-b-ink/50 transition-colors hover:text-b-accent"
              >
                <ArrowLeftIcon class="size-3.5 transition-transform group-hover:-translate-x-1" />
                Applications
              </button>

              <h1 class="font-['Anton',sans-serif] text-3xl uppercase leading-none tracking-wide text-b-ink sm:text-4xl">
                {application()?.name}
              </h1>

              <div class="flex border-b border-b-border/50">
                <A
                  href={`/applications/${applicationId()}/rpcs`}
                  class={`flex items-center gap-1.5 px-4 py-3 text-[0.65rem] font-bold uppercase tracking-widest transition-all duration-200 ${
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
                  class={`flex items-center gap-1.5 px-4 py-3 text-[0.65rem] font-bold uppercase tracking-widest transition-all duration-200 ${
                    getActiveTab() === "api-keys"
                      ? "border-b-2 border-b-accent bg-b-accent/5 text-b-accent"
                      : "text-b-ink/50 hover:text-b-ink hover:bg-b-ink/5"
                  }`}
                >
                  <KeyIcon class="size-3.5" />
                  API Keys
                </A>
                <A
                  href={`/applications/${applicationId()}/general`}
                  class={`flex items-center gap-1.5 px-4 py-3 text-[0.65rem] font-bold uppercase tracking-widest transition-all duration-200 ${
                    getActiveTab() === "general"
                      ? "border-b-2 border-b-accent bg-b-accent/5 text-b-accent"
                      : "text-b-ink/50 hover:text-b-ink hover:bg-b-ink/5"
                  }`}
                >
                  <SettingsIcon class="size-3.5" />
                  General
                </A>
                <A
                  href={`/applications/${applicationId()}/providers`}
                  class={`flex items-center gap-1.5 px-4 py-3 text-[0.65rem] font-bold uppercase tracking-widest transition-all duration-200 ${
                    getActiveTab() === "providers"
                      ? "border-b-2 border-b-accent bg-b-accent/5 text-b-accent"
                      : "text-b-ink/50 hover:text-b-ink hover:bg-b-ink/5"
                  }`}
                >
                  <ProviderIcon class="size-3.5" />
                  Providers
                </A>
              </div>
            </div>
          </Show>
        </div>
      </div>

      <div class="flex-1 px-6 py-6">
        <div class="mx-auto max-w-7xl">
          {props.children}
        </div>
      </div>
    </main>
  );
};

export default ApplicationLayout;