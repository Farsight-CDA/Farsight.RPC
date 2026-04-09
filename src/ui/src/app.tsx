import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { Suspense } from "solid-js";
import { AppShell } from "./components/AppShell";
import "./app.css";

export default function App() {
  return (
    <Router
      root={(props) => (
        <AppShell>
          <Suspense>{props.children}</Suspense>
        </AppShell>
      )}
    >
      <FileRoutes />
    </Router>
  );
}
