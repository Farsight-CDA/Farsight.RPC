import { createMutation } from "@tanstack/solid-query";
import { useNavigate } from "@solidjs/router";
import { createSignal } from "solid-js";
import { setToken } from "../lib/auth";
import { login } from "../lib/api";
import { MessageBanner } from "../components/MessageBanner";

export default function LoginPage() {
  const navigate = useNavigate();
  const [userName, setUserName] = createSignal("admin");
  const [password, setPassword] = createSignal("");
  const [message, setMessage] = createSignal<string | null>(null);
  const loginMutation = createMutation(() => ({
    mutationFn: ({ userName, password }: { userName: string; password: string }) => login(userName, password),
  }));

  const submit = async (event: SubmitEvent) => {
    event.preventDefault();
    setMessage(null);

    try {
      const response = await loginMutation.mutateAsync({ userName: userName(), password: password() });
      setToken(response.token);
      navigate("/", { replace: true });
    }
    catch(error) {
      setMessage(error instanceof Error ? error.message : "Login failed.");
    }
  };

  return (
    <div class="grid min-h-screen place-items-center px-6 py-10">
      <div class="w-full max-w-md space-y-6 rounded-[1.5rem] border border-white/10 bg-slate-900/80 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.22)] backdrop-blur">
        <div>
          <div class="mb-4 flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.24em] text-blue-300">
            <span class="rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1">Admin Console</span>
          </div>
          <h1 class="text-3xl font-semibold tracking-tight text-white">Farsight RPC Admin</h1>
          <p class="text-sm leading-6 text-slate-400">JWT-backed admin access for provider, endpoint, and API key management.</p>
        </div>
        <MessageBanner message={message()} tone="error" />
        <form class="space-y-4" onSubmit={submit}>
          <div class="grid gap-2">
            <label class="text-sm font-medium text-slate-300" for="userName">Username</label>
            <input id="userName" class="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-slate-50 outline-none transition placeholder:text-slate-500 focus:border-blue-400/70 focus:ring-2 focus:ring-blue-500/30" value={userName()} onInput={(event) => setUserName(event.currentTarget.value)} />
          </div>
          <div class="grid gap-2">
            <label class="text-sm font-medium text-slate-300" for="password">Password</label>
            <input id="password" class="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-slate-50 outline-none transition placeholder:text-slate-500 focus:border-blue-400/70 focus:ring-2 focus:ring-blue-500/30" type="password" value={password()} onInput={(event) => setPassword(event.currentTarget.value)} />
          </div>
          <button class="inline-flex w-full items-center justify-center rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-blue-50 shadow-lg shadow-blue-950/40 transition hover:bg-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/50 disabled:pointer-events-none disabled:opacity-60" type="submit" disabled={loginMutation.isPending}>{loginMutation.isPending ? "Signing in..." : "Sign in"}</button>
        </form>
      </div>
    </div>
  );
}
