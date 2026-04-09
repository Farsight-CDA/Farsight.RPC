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
    <div class="grid min-h-screen place-items-center px-4">
      <div class="w-full max-w-md space-y-4 rounded border border-white/10 bg-slate-900 p-6">
        <div>
          <span class="text-xs text-blue-400">Admin Console</span>
          <h1 class="text-2xl text-white">Farsight RPC Admin</h1>
          <p class="text-sm text-slate-400">JWT-backed admin access for provider, endpoint, and API key management.</p>
        </div>
        <MessageBanner message={message()} tone="error" />
        <form class="space-y-4" onSubmit={submit}>
          <div class="grid gap-2">
            <label class="text-sm text-slate-300" for="userName">Username</label>
            <input id="userName" class="w-full rounded border border-white/10 bg-slate-950 px-3 py-2 text-sm" value={userName()} onInput={(event) => setUserName(event.currentTarget.value)} />
          </div>
          <div class="grid gap-2">
            <label class="text-sm text-slate-300" for="password">Password</label>
            <input id="password" class="w-full rounded border border-white/10 bg-slate-950 px-3 py-2 text-sm" type="password" value={password()} onInput={(event) => setPassword(event.currentTarget.value)} />
          </div>
          <button class="w-full rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-500 disabled:opacity-50" type="submit" disabled={loginMutation.isPending}>{loginMutation.isPending ? "Signing in..." : "Sign in"}</button>
        </form>
      </div>
    </div>
  );
}
