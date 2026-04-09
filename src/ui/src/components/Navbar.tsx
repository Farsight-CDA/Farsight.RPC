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
    <header class="flex h-16 shrink-0 items-center justify-between border-b-4 border-[var(--color-b-ink)] bg-b-paper/80 backdrop-blur-sm px-5 sticky top-0 z-40">
      <span class="font-['Anton',sans-serif] text-2xl uppercase tracking-wide text-b-ink hover:text-b-accent transition-colors duration-200 cursor-default">
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
