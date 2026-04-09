import { type ParentComponent } from "solid-js";
import { Navigate } from "@solidjs/router";
import { useAuth } from "../lib/auth";

const RequireAuth: ParentComponent = (props) => {
  const auth = useAuth();
  return auth.isAuthenticated() ? <>{props.children}</> : <Navigate href="/login" />;
};

export default RequireAuth;