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
            <header class="border-b border-white/10 bg-slate-950">
              <div class="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
                <div class="flex flex-col gap-3 lg:flex-row lg:items-center">
                  <div class="text-sm font-bold uppercase tracking-wider text-blue-400">Farsight RPC</div>
                  <nav class="flex flex-wrap gap-2">
                    {navItems.map((item) => (
                      <A
                        href={item.href}
                        class={`px-4 py-2 text-sm rounded ${location.pathname === item.href
                          ? "bg-blue-600 text-white"
                          : "text-slate-300 hover:bg-white/10"}`}
                      >
                        {item.label}
                      </A>
                    ))}
                  </nav>
                </div>
                <div class="flex items-center gap-3">
                  <Show when={authed()}>
                    <span class="rounded bg-emerald-500/20 px-3 py-1 text-xs text-emerald-300">Admin</span>
                  </Show>
                  <button class="rounded border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10" type="button" onClick={logout}>Logout</button>
                </div>
              </div>
            </header>
            <main class="mx-auto max-w-7xl px-4 py-6">{props.children}</main>
          </div>
        </RequireAuth>
      )}
    >
      <div class="min-h-screen">{props.children}</div>
    </Show>
  );
};
