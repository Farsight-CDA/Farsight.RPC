import { useNavigate } from "@solidjs/router";
import { useAuth } from "../lib/auth";

export default function Navbar() {
  const auth = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    auth.logout();
    navigate("/login", { replace: true });
  };

  return (
    <header class="flex h-16 shrink-0 items-center justify-between border-b-4 border-[var(--color-b-ink)] bg-b-paper px-5">
      <span class="font-['Anton',sans-serif] text-2xl uppercase tracking-wide text-b-ink">
        Farsight RPC
      </span>
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
