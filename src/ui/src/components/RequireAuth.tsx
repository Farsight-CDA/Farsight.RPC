import { type ParentComponent } from "solid-js";
import { Navigate } from "@solidjs/router";
import { useAuth } from "../lib/auth";
import Navbar from "./Navbar";

const RequireAuth: ParentComponent = (props) => {
  const auth = useAuth();
  return auth.isAuthenticated() ? (
    <div class="flex min-h-screen flex-col bg-transparent">
      <Navbar />
      {props.children}
    </div>
  ) : (
    <Navigate href="/login" />
  );
};

export default RequireAuth;
