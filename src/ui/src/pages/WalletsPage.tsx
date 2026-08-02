import { A } from "@solidjs/router";
import { createSignal, createMemo, Show } from "solid-js";
import BackIcon from "../components/icons/BackIcon";
import SearchIcon from "../components/icons/SearchIcon";
import WalletIcon from "../components/icons/WalletIcon";

const wallets: unknown[] = [];

export default function WalletsPage() {
  const [searchQuery, setSearchQuery] = createSignal("");

  const filteredWallets = createMemo(() => {
    const query = searchQuery().toLowerCase().trim();

    if (query) {
      return wallets.filter((wallet) =>
        String(wallet).toLowerCase().includes(query),
      );
    }

    return wallets;
  });

  const walletCount = wallets.length;
  const filteredCount = filteredWallets().length;

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
                Wallets
              </h2>
              <button
                type="button"
                class="btn btn-md btn-interactive btn-primary shrink-0 text-center"
              >
                Create
              </button>
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
                  Showing {filteredCount} of {walletCount}
                </span>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div class="px-5 pb-5 sm:px-8 sm:pb-8 pt-2">
            {/* Empty State */}
            <Show when={filteredWallets().length === 0 && !searchQuery()}>
              <div class="flex flex-col items-center justify-center gap-3 py-12 border border-dashed border-b-border/50 bg-b-paper/20">
                <WalletIcon class="size-6 text-b-ink/30" />
                <p class="text-sm font-semibold uppercase tracking-wider text-b-ink/50">
                  No wallets yet
                </p>
                <button
                  type="button"
                  class="btn btn-sm btn-interactive btn-primary"
                >
                  Create
                </button>
              </div>
            </Show>

            {/* No Search Results */}
            <Show when={filteredWallets().length === 0 && searchQuery()}>
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
