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
      <div class="w-full max-w-md border border-b-border bg-b-field p-8 shadow-[0_25px_50px_rgba(0,0,0,0.5)]">
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
              class="text-xs font-bold uppercase tracking-widest text-b-ink/70"
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
              class="h-11 w-full border border-b-border bg-b-paper px-4 text-sm font-semibold text-b-ink placeholder:text-b-ink/25 outline-none focus-visible:border-b-accent/50 focus-visible:ring-2 focus-visible:ring-b-accent/20 hover:border-b-border-hover transition-all duration-200"
              placeholder="ADMIN"
            />
          </div>

          <div class="flex flex-col gap-2">
            <label
              for="password"
              class="text-xs font-bold uppercase tracking-widest text-b-ink/70"
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
              class="h-11 w-full border border-b-border bg-b-paper px-4 text-sm font-semibold text-b-ink placeholder:text-b-ink/25 outline-none focus-visible:border-b-accent/50 focus-visible:ring-2 focus-visible:ring-b-accent/20 hover:border-b-border-hover transition-all duration-200"
              placeholder="********"
            />
          </div>

          {error() && (
            <p class="border border-red-500/40 bg-red-500/10 px-3 py-3 text-xs font-bold uppercase leading-snug text-red-400">
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
