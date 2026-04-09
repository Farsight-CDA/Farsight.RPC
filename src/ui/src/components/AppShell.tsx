import { A, useLocation, useNavigate } from "@solidjs/router";
import { createSignal, onCleanup, onMount, Show, type ParentComponent } from "solid-js";
import { clearToken, isAuthenticated, subscribeToAuthChanges } from "../lib/auth";
import { RequireAuth } from "./RequireAuth";

const navItems = [
  { href: "/", label: "Dashboard" },
  { href: "/applications", label: "Applications" },
  { href: "/chains", label: "Chains" },
  { href: "/providers-admin", label: "Providers" },
  { href: "/endpoints", label: "Endpoints" },
  { href: "/admin", label: "API Keys" },
];

export const AppShell: ParentComponent = (props) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [authed, setAuthed] = createSignal(false);
  const isLoginRoute = () => location.pathname === "/login";

  onMount(() => {
    setAuthed(isAuthenticated());
    const unsubscribe = subscribeToAuthChanges(() => setAuthed(isAuthenticated()));
    onCleanup(unsubscribe);
  });

  const logout = () => {
    clearToken();
    navigate("/login", { replace: true });
  };

  return (
    <Show
      when={isLoginRoute()}
      fallback={(
        <RequireAuth>
          <div class="min-h-screen">
            <header class="sticky top-0 z-20 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
              <div class="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
                <div class="flex flex-col gap-3 lg:flex-row lg:items-center">
                  <div class="text-sm font-bold uppercase tracking-[0.3em] text-blue-300">Farsight RPC</div>
                  <nav class="flex flex-wrap gap-2">
                    {navItems.map((item) => (
                      <A
                        href={item.href}
                        class={`inline-flex items-center rounded-full px-4 py-2 text-sm font-medium transition ${location.pathname === item.href
                          ? "bg-blue-600 text-blue-50 shadow-lg shadow-blue-950/40"
                          : "text-slate-300 hover:bg-white/10 hover:text-white"}`}
                      >
                        {item.label}
                      </A>
                    ))}
                  </nav>
                </div>
                <div class="flex flex-wrap items-center gap-3">
                  <Show when={authed()}>
                    <span class="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-emerald-200">Admin</span>
                  </Show>
                  <button class="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/50 disabled:pointer-events-none disabled:opacity-60" type="button" onClick={logout}>Logout</button>
                </div>
              </div>
            </header>
            <main class="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{props.children}</main>
          </div>
        </RequireAuth>
      )}
    >
      <div class="min-h-screen">{props.children}</div>
    </Show>
  );
};
