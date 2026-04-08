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
  const [submitting, setSubmitting] = createSignal(false);

  const submit = async (event: SubmitEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      const response = await login(userName(), password());
      setToken(response.token);
      navigate("/", { replace: true });
    }
    catch(error) {
      setMessage(error instanceof Error ? error.message : "Login failed.");
    }
    finally {
      setSubmitting(false);
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
          <button class="button" type="submit" disabled={submitting()}>{submitting() ? "Signing in..." : "Sign in"}</button>
        </form>
      </div>
    </div>
  );
}
