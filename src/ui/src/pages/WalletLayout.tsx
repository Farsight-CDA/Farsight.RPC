import { A, useParams, useLocation } from "@solidjs/router";
import { Show, createMemo, type ParentComponent } from "solid-js";
import { useReferenceData } from "../lib/reference-data";
import { DETAIL_PAGE_MAX_WIDTH } from "../lib/layout";
import LoadingSpinner from "../components/LoadingSpinner";
import DetailPageHeader from "../components/DetailPageHeader";
import KeyIcon from "../components/icons/KeyIcon";
import SettingsIcon from "../components/icons/SettingsIcon";
import StructureIcon from "../components/icons/StructureIcon";
import WalletIcon from "../components/icons/WalletIcon";

const WalletLayout: ParentComponent = (props) => {
  const params = useParams();
  const location = useLocation();
  const referenceData = useReferenceData();

  const walletId = () => params.walletId;
  const wallets = referenceData.wallets.data;
  const walletsState = referenceData.wallets.state;

  const wallet = createMemo(
    () => wallets().find((w) => w.id === walletId()) ?? null,
  );

  const getActiveTab = () => {
    const path = location.pathname;
    if (path.includes("/private-key-groups")) return "key-groups";
    if (path.includes("/private-keys")) return "private-keys";
    return "general";
  };

  return (
    <main class="flex flex-1 flex-col min-h-0">
      <Show
        when={walletsState() === "pending" || walletsState() === "idle"}
      >
        <div class="flex flex-1 items-center justify-center">
          <div class="flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-b-ink/80">
            <LoadingSpinner class="size-5" />
            Loading wallet…
          </div>
        </div>
      </Show>

      <Show
        when={walletsState() !== "pending" && walletsState() !== "idle"}
      >
        <Show
          when={wallet()}
          fallback={
            <div class="flex flex-1 flex-col items-center justify-center gap-3 py-24">
              <WalletIcon class="size-10 text-b-ink/20" />
              <p class="text-sm font-semibold uppercase tracking-wider text-b-ink/50">
                Wallet not found.
              </p>
              <A
                href="/wallets"
                class="btn btn-sm btn-interactive btn-primary"
              >
                Back to wallets
              </A>
            </div>
          }
        >
          <DetailPageHeader
            backHref="/wallets"
            backLabel="Wallets"
            title={
              <>
                <span
                  class="inline-block size-3 rounded-full shrink-0"
                  style={{ "background-color": wallet()?.color ?? "#6B7280" }}
                />
                {wallet()?.name}
              </>
            }
            tabs={[
              {
                href: `/wallets/${walletId()}/general`,
                label: "General",
                icon: <SettingsIcon class="size-3.5" />,
                active: getActiveTab() === "general",
              },
              {
                href: `/wallets/${walletId()}/private-keys`,
                label: "Private Keys",
                icon: <KeyIcon class="size-3.5" />,
                active: getActiveTab() === "private-keys",
              },
              {
                href: `/wallets/${walletId()}/private-key-groups`,
                label: "Key Groups",
                icon: <StructureIcon class="size-3.5" />,
                active: getActiveTab() === "key-groups",
              },
            ]}
          />

          <div class="flex flex-1 flex-col overflow-hidden px-6 py-4 min-h-0">
            <div class={`mx-auto ${DETAIL_PAGE_MAX_WIDTH} flex flex-1 flex-col overflow-hidden min-h-0 w-full`}>{props.children}</div>
          </div>
        </Show>
      </Show>
    </main>
  );
};

export default WalletLayout;
