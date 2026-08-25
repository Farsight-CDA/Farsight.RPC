import { useNavigate } from "@solidjs/router";
import {
  For,
  Show,
  createEffect,
  createMemo,
  type ParentComponent,
} from "solid-js";
import { useReferenceData } from "../lib/reference-data";
import { DETAIL_PAGE_MAX_WIDTH } from "../lib/layout";
import { useParams, useLocation, useSearchParams } from "@solidjs/router";
import LoadingSpinner from "../components/LoadingSpinner";
import DetailPageHeader from "../components/DetailPageHeader";
import RpcIcon from "../components/icons/RpcIcon";
import KeyIcon from "../components/icons/KeyIcon";
import SettingsIcon from "../components/icons/SettingsIcon";
import ProviderIcon from "../components/icons/ProviderIcon";
import EnvironmentIcon from "../components/icons/EnvironmentIcon";
import RuleIcon from "../components/icons/RuleIcon";
import WarningIcon from "../components/icons/WarningIcon";
import ChevronDownIcon from "../components/icons/ChevronDownIcon";
import { useEnvironment } from "../lib/environment-context";
import { useApplicationData } from "../lib/application-data";
import { highestChainRuleFailureSeverity } from "../lib/rule-validation";

function EnvironmentSelector() {
  const environment = useEnvironment();

  return (
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
          class="h-9 w-48 appearance-none border border-b-border bg-b-field px-3 pr-8 text-[0.65rem] font-bold tracking-widest text-b-ink outline-none focus-visible:border-b-accent/50 focus-visible:ring-2 focus-visible:ring-b-accent/20 hover:border-b-border-hover transition-all duration-200 cursor-pointer"
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
  );
}

const ApplicationLayoutContent: ParentComponent = (props) => {
  const referenceData = useReferenceData();
  const navigate = useNavigate();
  const params = useParams();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const applicationId = () => params.applicationId;
  const environment = useEnvironment();
  const applicationData = useApplicationData();

  const ruleFailureSeverity = createMemo(() => {
    const selectedEnvironment = environment.selectedEnvironmentId();
    const chains = environment.environments().find(
      (env) => env.id === selectedEnvironment,
    )?.chains;
    if (!chains || chains.length === 0) return null;
    return highestChainRuleFailureSeverity(
      selectedEnvironment,
      chains,
      applicationData.rpcs.data(),
      applicationData.rules.data(),
    );
  });

  const applications = referenceData.applications.data;
  const applicationsState = referenceData.applications.state;
  const applicationsError = referenceData.applications.error;

  const application = createMemo(
    () => applications().find((app) => app.id === applicationId()) ?? null,
  );

  const getActiveTab = () => {
    const path = location.pathname;
    if (path.includes("/api-keys")) return "api-keys";
    if (path.includes("/environments")) return "environments";
    if (path.includes("/general")) return "general";
    if (path.includes("/providers")) return "providers";
    if (path.includes("/rules")) return "rules";
    return "rpcs";
  };

  const isRpcsTab = () => getActiveTab() === "rpcs";
  const isRulesTab = () => getActiveTab() === "rules";

  const applicationHref = (tab: string) => {
    const query = new URLSearchParams();
    const environmentId = environment.selectedEnvironmentId();
    if (environmentId) query.set("environment", environmentId);

    const chain = searchParams.chain;
    const chainName = Array.isArray(chain) ? chain[0] : chain;
    if (tab === "rpcs" && chainName) query.set("chain", chainName);

    const search = query.toString();
    return `/applications/${applicationId()}/${tab}${search ? `?${search}` : ""}`;
  };

  createEffect(() => {
    if (!isRpcsTab() && searchParams.chain !== undefined) {
      setSearchParams({ chain: undefined }, { replace: true });
    }
  });

  return (
    <main class="flex flex-1 flex-col min-h-0">
      <Show when={applicationsState() === "pending"}>
        <div class="shrink-0 border-b border-b-border bg-b-field/50 px-6 py-3">
          <div class="mx-auto max-w-7xl">
            <div class="flex items-center gap-3 text-sm font-semibold uppercase tracking-wider text-b-ink/70">
              <LoadingSpinner class="size-5" />
              Loading application…
            </div>
          </div>
        </div>
      </Show>

      <Show when={applicationsError()}>
        <div class="shrink-0 border-b border-b-border bg-b-field/50 px-6 py-3">
          <div class="mx-auto max-w-7xl">
            <p class="border-4 border-red-500/50 bg-red-500/10 px-3 py-3 text-xs font-bold uppercase leading-snug text-red-400">
              {applicationsError()!.message}
            </p>
          </div>
        </div>
      </Show>

      <Show when={application() && applicationsState() === "ready"}>
        <DetailPageHeader
          backHref="/applications"
          backLabel="Applications"
          title={
            <>
              <span
                class="inline-block size-3 rounded-full shrink-0"
                style={{
                  "background-color": application()?.color ?? "#6B7280",
                }}
              />
              {application()?.name}
              <Show when={ruleFailureSeverity()}>
                <WarningIcon
                  class={`size-5 ${
                    ruleFailureSeverity() === "Red"
                      ? "text-red-400"
                      : "text-amber-300"
                  }`}
                />
              </Show>
            </>
          }
          tabs={[
            {
              href: applicationHref("general"),
              label: "General",
              icon: <SettingsIcon class="size-3.5" />,
              active: getActiveTab() === "general",
            },
            {
              href: applicationHref("environments"),
              label: "Environments",
              icon: <EnvironmentIcon class="size-3.5" />,
              active: getActiveTab() === "environments",
            },
            {
              href: applicationHref("providers"),
              label: "Providers",
              icon: <ProviderIcon class="size-3.5" />,
              active: getActiveTab() === "providers",
            },
            {
              href: applicationHref("rpcs"),
              label: "RPCs",
              icon: <RpcIcon class="size-3.5" />,
              active: getActiveTab() === "rpcs",
            },
            {
              href: applicationHref("rules"),
              label: "Rules",
              icon: <RuleIcon class="size-3.5" />,
              active: getActiveTab() === "rules",
            },
            {
              href: applicationHref("api-keys"),
              label: "API Keys",
              icon: <KeyIcon class="size-3.5" />,
              active: getActiveTab() === "api-keys",
            },
          ]}
          trailing={
            <Show when={isRpcsTab() || isRulesTab()}>
              <EnvironmentSelector />
            </Show>
          }
        />
      </Show>

      <div class="flex flex-1 flex-col overflow-hidden px-6 py-4 min-h-0">
        <div class={`mx-auto ${DETAIL_PAGE_MAX_WIDTH} flex flex-1 flex-col overflow-hidden min-h-0 w-full`}>{props.children}</div>
      </div>
    </main>
  );
};

const ApplicationLayout: ParentComponent = (props) => {
  return <ApplicationLayoutContent>{props.children}</ApplicationLayoutContent>;
};

export default ApplicationLayout;
