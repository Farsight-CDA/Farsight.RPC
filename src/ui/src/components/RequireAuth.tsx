import { Show, type ParentComponent } from "solid-js";
import { Navigate } from "@solidjs/router";
import { useAuth } from "../lib/auth";
import { useReferenceData } from "../lib/reference-data";
import LoadingSpinner from "./LoadingSpinner";
import Navbar from "./Navbar";

const RequireAuth: ParentComponent = (props) => {
  const auth = useAuth();
  const referenceData = useReferenceData();
  return auth.isAuthenticated() ? (
    <div class="flex h-screen flex-col overflow-hidden bg-transparent">
      <Navbar />
      <Show
        when={referenceData.isReferenceDataReady()}
        fallback={
          <div class="flex flex-1 flex-col items-center justify-center gap-3 py-24">
            <LoadingSpinner class="size-8 text-b-accent" />
          </div>
        }
      >
        {props.children}
      </Show>
    </div>
  ) : (
    <Navigate href="/login" />
  );
};

export default RequireAuth;
