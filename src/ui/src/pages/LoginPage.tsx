import { createSignal, Show } from "solid-js";
import { useNavigate } from "@solidjs/router";
import LoadingSpinner from "../components/LoadingSpinner";
import { useAuth } from "../lib/auth";
import { useReferenceData } from "../lib/reference-data";

export default function LoginPage() {
  const auth = useAuth();
  const referenceData = useReferenceData();
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
      const session = await auth.login(username(), password());
      await referenceData.load(session.token);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div class="flex min-h-screen items-center justify-center px-4 py-12">
      <div class="w-full max-w-md border-4 border-[var(--color-b-ink)] bg-b-field p-8 shadow-[12px_12px_0_0_rgba(255,87,34,0.15)] hover:shadow-[16px_16px_0_0_rgba(255,87,34,0.25)] transition-shadow duration-300">
        <p class="mb-2 text-xs font-bold uppercase tracking-[0.35em] text-b-accent">
          Access
        </p>
        <h1 class="mb-10 font-['Anton',sans-serif] text-5xl uppercase leading-none tracking-wide text-b-ink">
          Farsight RPC
        </h1>

        <form onSubmit={handleSubmit} class="flex flex-col gap-6">
          <div class="flex flex-col gap-2">
            <label
              for="username"
              class="text-xs font-bold uppercase tracking-widest text-b-ink/80"
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
              class="border-4 border-[var(--color-b-ink)] bg-b-paper px-3 py-3 text-sm font-semibold text-b-ink placeholder:text-b-ink/30 outline-none focus-visible:ring-4 focus-visible:ring-b-accent/50 hover:border-b-accent/50 transition-colors duration-200"
              placeholder="ADMIN"
            />
          </div>

          <div class="flex flex-col gap-2">
            <label
              for="password"
              class="text-xs font-bold uppercase tracking-widest text-b-ink/80"
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
              class="border-4 border-[var(--color-b-ink)] bg-b-paper px-3 py-3 text-sm font-semibold text-b-ink placeholder:text-b-ink/30 outline-none focus-visible:ring-4 focus-visible:ring-b-accent/50 hover:border-b-accent/50 transition-colors duration-200"
              placeholder="********"
            />
          </div>

          {error() && (
            <p class="border-4 border-red-500/50 bg-red-500/10 px-3 py-3 text-xs font-bold uppercase leading-snug text-red-400">
              {error()}
            </p>
          )}

          <button
            type="submit"
            disabled={loading()}
            class="btn btn-interactive btn-disabled btn-primary mt-2 px-4 py-4 text-sm tracking-[0.2em]"
          >
            <Show when={loading()}>
              <LoadingSpinner class="size-4 text-b-paper" />
            </Show>
            {loading() ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
