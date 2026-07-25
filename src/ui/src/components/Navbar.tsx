import { A, useLocation, useNavigate } from "@solidjs/router";
import { createSignal, onCleanup, onMount, Show } from "solid-js";
import { useAuth } from "../lib/auth";
import { useEscapeKey } from "../lib/useEscapeKey";
import ChevronDownIcon from "./icons/ChevronDownIcon";
import UserIcon from "./icons/UserIcon";

export default function Navbar() {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [menuOpen, setMenuOpen] = createSignal(false);
  let menuRef: HTMLDivElement | undefined;

  onMount(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      if (menuRef && !menuRef.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("click", handleDocumentClick);
    onCleanup(() => document.removeEventListener("click", handleDocumentClick));
  });

  useEscapeKey(menuOpen, () => setMenuOpen(false));

  const handleLogout = () => {
    setMenuOpen(false);
    auth.logout();
    navigate("/login", { replace: true });
  };

  const handleAccount = () => {
    setMenuOpen(false);
    navigate("/account");
  };

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <header class="flex h-16 shrink-0 items-center justify-between border-b border-b-border bg-b-paper/90 backdrop-blur-md px-6 sticky top-0 z-40">
      <span
        onClick={() => navigate("/")}
        class="font-['Anton',sans-serif] text-2xl uppercase tracking-wide text-b-ink hover:text-b-accent transition-colors duration-200 cursor-pointer"
      >
        Farsight RPC
      </span>

      <div class="flex items-center gap-1">
        <A
          href="/applications"
          class={`px-4 py-2 text-xs font-bold uppercase tracking-widest transition-all duration-200 ${
            isActive("/applications")
              ? "text-b-accent border-b-2 border-b-accent -mb-[1px]"
              : "text-b-ink/50 hover:text-b-ink"
          }`}
        >
          Applications
        </A>
        <A
          href="/errors"
          class={`px-4 py-2 text-xs font-bold uppercase tracking-widest transition-all duration-200 ${
            isActive("/errors")
              ? "text-b-accent border-b-2 border-b-accent -mb-[1px]"
              : "text-b-ink/50 hover:text-b-ink"
          }`}
        >
          Errors
        </A>
      </div>

      <div class="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-haspopup="menu"
          aria-expanded={menuOpen()}
          aria-label="Account menu"
          class={`btn btn-interactive flex size-9 items-center justify-center border transition-all duration-200 ${
            isActive("/account")
              ? "border-b-accent/50 bg-b-accent/10 text-b-accent"
              : "border-b-border bg-b-field text-b-ink/70 hover:border-b-border-hover hover:bg-b-stripe hover:text-b-ink"
          }`}
        >
          <UserIcon class="size-4" />
        </button>

        <Show when={menuOpen()}>
          <div
            role="menu"
            aria-label="Account"
            class="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-56 border border-b-border bg-b-field shadow-[0_25px_50px_rgba(0,0,0,0.5)]"
          >
            <div class="border-b border-b-border px-4 py-3">
              <p class="text-[0.65rem] font-bold uppercase tracking-widest text-b-ink/40">
                Signed in as
              </p>
              <p class="mt-0.5 truncate text-xs font-bold uppercase tracking-widest text-b-ink">
                {auth.username}
              </p>
            </div>
            <div class="py-1">
              <button
                type="button"
                role="menuitem"
                onClick={handleAccount}
                class="flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left text-xs font-bold uppercase tracking-widest text-b-ink/70 hover:bg-b-stripe hover:text-b-ink transition-colors duration-200"
              >
                Account
                <ChevronDownIcon class="size-3 -rotate-90 text-b-ink/40" />
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={handleLogout}
                class="flex w-full items-center gap-2 px-4 py-2.5 text-left text-xs font-bold uppercase tracking-widest text-b-ink/70 hover:bg-b-stripe hover:text-b-ink transition-colors duration-200"
              >
                Log out
              </button>
            </div>
          </div>
        </Show>
      </div>
    </header>
  );
}
