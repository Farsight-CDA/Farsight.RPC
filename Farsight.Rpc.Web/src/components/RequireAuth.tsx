import { useNavigate } from "@solidjs/router";
import { onMount, Show, createSignal, type ParentComponent } from "solid-js";
import { isAuthenticated } from "../lib/auth";

export const RequireAuth: ParentComponent = (props) => {
  const navigate = useNavigate();
  const [ready, setReady] = createSignal(false);

  onMount(() => {
    if(!isAuthenticated()) {
      navigate("/login", { replace: true });
      return;
    }

    setReady(true);
  });

  return <Show when={ready()}>{props.children}</Show>;
};
