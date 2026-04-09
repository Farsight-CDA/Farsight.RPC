import { createSignal } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { useAuth } from "../lib/auth";

export default function LoginPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = createSignal("");
  const [password, setPassword] = createSignal("");
  const [error, setError] = createSignal<string | null>(null);
  const [loading, setLoading] = createSignal(false);

  const handleSubmit = async (e: SubmitEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await auth.login(username(), password());
      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div class="flex min-h-screen items-center justify-center px-4 py-12">
      <div class="w-full max-w-md border-4 border-[var(--color-b-ink)] bg-b-field p-8 shadow-[12px_12px_0_0_var(--color-b-ink)]">
        <p class="mb-2 text-xs font-bold uppercase tracking-[0.35em] text-b-ink">
          Access
        </p>
        <h1 class="mb-10 font-['Anton',sans-serif] text-5xl uppercase leading-none tracking-wide text-b-ink">
          Farsight RPC
        </h1>

        <form onSubmit={handleSubmit} class="flex flex-col gap-6">
          <div class="flex flex-col gap-2">
            <label
              for="username"
              class="text-xs font-bold uppercase tracking-widest text-b-ink"
            >
              Username
            </label>
            <input
              id="username"
              type="text"
              autocomplete="username"
              required
              value={username()}
              onInput={(e) => setUsername(e.currentTarget.value)}
              class="border-4 border-[var(--color-b-ink)] bg-b-paper px-3 py-3 text-sm font-semibold text-b-ink placeholder:text-b-ink/40 outline-none focus-visible:ring-4 focus-visible:ring-b-accent"
              placeholder="ADMIN"
            />
          </div>

          <div class="flex flex-col gap-2">
            <label
              for="password"
              class="text-xs font-bold uppercase tracking-widest text-b-ink"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              autocomplete="current-password"
              required
              value={password()}
              onInput={(e) => setPassword(e.currentTarget.value)}
              class="border-4 border-[var(--color-b-ink)] bg-b-paper px-3 py-3 text-sm font-semibold text-b-ink placeholder:text-b-ink/40 outline-none focus-visible:ring-4 focus-visible:ring-b-accent"
              placeholder="********"
            />
          </div>

          {error() && (
            <p class="border-4 border-[var(--color-b-accent)] bg-b-paper px-3 py-3 text-xs font-bold uppercase leading-snug text-b-accent">
              {error()}
            </p>
          )}

          <button
            type="submit"
            disabled={loading()}
            class="mt-2 border-4 border-[var(--color-b-ink)] bg-b-ink px-4 py-4 text-sm font-bold uppercase tracking-[0.2em] text-b-paper shadow-[6px_6px_0_0_var(--color-b-accent)] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[8px_8px_0_0_var(--color-b-accent)] focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-b-accent disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none disabled:hover:translate-x-0 disabled:hover:translate-y-0"
          >
            {loading() ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
