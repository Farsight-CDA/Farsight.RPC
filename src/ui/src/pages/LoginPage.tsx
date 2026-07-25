import { createSignal, Show } from "solid-js";
import { useNavigate } from "@solidjs/router";
import KeyIcon from "../components/icons/KeyIcon";
import LoadingSpinner from "../components/LoadingSpinner";
import { useAuth } from "../lib/auth";
import { useReferenceData } from "../lib/reference-data";
import {
  isWebAuthnSupported,
  type AssertionOptionsJson,
} from "../lib/webauthn";

type PendingTwoFactor = {
  challengeId: string;
  options: AssertionOptionsJson;
};

export default function LoginPage() {
  const auth = useAuth();
  const referenceData = useReferenceData();
  const navigate = useNavigate();
  const [username, setUsername] = createSignal("");
  const [password, setPassword] = createSignal("");
  const [error, setError] = createSignal<string | null>(null);
  const [loading, setLoading] = createSignal(false);
  const [pendingTwoFactor, setPendingTwoFactor] =
    createSignal<PendingTwoFactor | null>(null);

  const finishLogin = async (session: {
    token: string | null;
  }) => {
    await referenceData.load(session.token);
    navigate("/", { replace: true });
  };

  const handleSubmit = async (e: SubmitEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await auth.login(username(), password());
      if (result.kind === "requiresTwoFactor") {
        setPassword("");
        setPendingTwoFactor({
          challengeId: result.challengeId,
          options: result.options,
        });
        return;
      }
      await finishLogin(result.state);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSecurityKey = async () => {
    const pending = pendingTwoFactor();
    if (!pending) return;
    setError(null);
    setLoading(true);
    try {
      const session = await auth.loginWithSecurityKey(
        pending.challengeId,
        pending.options,
      );
      await finishLogin(session);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setPendingTwoFactor(null);
    setPassword("");
    setError(null);
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

        <Show
          when={!pendingTwoFactor()}
          fallback={
            <div class="flex flex-col gap-6">
              <div class="flex items-center gap-3">
                <div class="flex size-10 items-center justify-center border border-b-ink/20 bg-b-ink/5">
                  <KeyIcon class="size-5 text-b-ink/70" />
                </div>
                <div>
                  <h2 class="font-['Anton',sans-serif] text-xl uppercase tracking-wide text-b-ink">
                    Two-Factor Authentication
                  </h2>
                  <p class="text-xs font-bold uppercase tracking-widest text-b-ink/50">
                    {username()}
                  </p>
                </div>
              </div>

              <p class="text-sm font-semibold text-b-ink/70">
                This account is protected by a security key. Insert your key and
                use it to finish signing in.
              </p>

              <Show when={!isWebAuthnSupported()}>
                <p class="border border-amber-500/40 bg-amber-500/10 px-3 py-3 text-xs font-bold uppercase leading-snug text-amber-300">
                  This browser does not support security keys.
                </p>
              </Show>

              {error() && (
                <p class="border border-red-500/40 bg-red-500/10 px-3 py-3 text-xs font-bold uppercase leading-snug text-red-400">
                  {error()}
                </p>
              )}

              <button
                type="button"
                onClick={() => void handleSecurityKey()}
                disabled={loading() || !isWebAuthnSupported()}
                class="btn btn-interactive btn-disabled btn-primary mt-2 px-4 py-4 text-sm tracking-[0.2em]"
              >
                <Show when={loading()}>
                  <LoadingSpinner class="size-4 text-b-paper" />
                </Show>
                {loading()
                  ? "Waiting for security key…"
                  : "Use security key"}
              </button>

              <button
                type="button"
                onClick={handleBack}
                disabled={loading()}
                class="btn btn-sm btn-interactive btn-disabled btn-secondary"
              >
                Back
              </button>
            </div>
          }
        >
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
        </Show>
      </div>
    </div>
  );
}
