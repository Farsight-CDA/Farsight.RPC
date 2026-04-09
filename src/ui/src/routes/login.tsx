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
    <div class="login-page">
      <div class="panel login-card stack">
        <div>
          <h1>Farsight RPC Admin</h1>
          <p class="muted">JWT-backed admin access for provider, endpoint, and API key management.</p>
        </div>
        <MessageBanner message={message()} tone="error" />
        <form class="stack" onSubmit={submit}>
          <div class="form-field">
            <label for="userName">Username</label>
            <input id="userName" class="input" value={userName()} onInput={(event) => setUserName(event.currentTarget.value)} />
          </div>
          <div class="form-field">
            <label for="password">Password</label>
            <input id="password" class="input" type="password" value={password()} onInput={(event) => setPassword(event.currentTarget.value)} />
          </div>
          <button class="button" type="submit" disabled={loginMutation.isPending}>{loginMutation.isPending ? "Signing in..." : "Sign in"}</button>
        </form>
      </div>
    </div>
  );
}
