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
        class="border-4 border-[var(--color-b-ink)] bg-b-paper px-4 py-2 text-xs font-bold uppercase tracking-widest text-b-ink shadow-[4px_4px_0_0_var(--color-b-ink)] transition-transform hover:-translate-x-px hover:-translate-y-px hover:shadow-[6px_6px_0_0_var(--color-b-ink)] focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-b-accent active:translate-x-0 active:translate-y-0 active:shadow-[2px_2px_0_0_var(--color-b-ink)]"
      >
        Log out
      </button>
    </header>
  );
}
