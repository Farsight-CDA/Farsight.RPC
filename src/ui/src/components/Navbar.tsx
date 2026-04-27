import { A, useLocation, useNavigate } from "@solidjs/router";
import { useAuth } from "../lib/auth";

export default function Navbar() {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    auth.logout();
    navigate("/login", { replace: true });
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

      <button
        type="button"
        onClick={handleLogout}
        class="btn btn-interactive btn-sm btn-secondary"
      >
        Log out
      </button>
    </header>
  );
}
