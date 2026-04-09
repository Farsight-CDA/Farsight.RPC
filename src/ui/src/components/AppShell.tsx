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

  onMount(() => {
    setAuthed(isAuthenticated());
    const unsubscribe = subscribeToAuthChanges(() => setAuthed(isAuthenticated()));
    onCleanup(unsubscribe);
  });

  const logout = () => {
    clearToken();
    navigate("/login", { replace: true });
  };

  if(location.pathname === "/login") {
    return <div class="shell">{props.children}</div>;
  }

  return (
    <RequireAuth>
      <div class="shell">
        <header class="topbar">
          <div class="row">
            <div class="brand">Farsight RPC</div>
            <nav class="nav">
              {navItems.map((item) => (
                <A href={item.href} classList={{ active: location.pathname === item.href }}>
                  {item.label}
                </A>
              ))}
            </nav>
          </div>
          <div class="topbar-actions">
            <Show when={authed()}>
              <span class="muted">Admin</span>
            </Show>
            <button class="button ghost" type="button" onClick={logout}>Logout</button>
          </div>
        </header>
        <main class="content">{props.children}</main>
      </div>
    </RequireAuth>
  );
};
