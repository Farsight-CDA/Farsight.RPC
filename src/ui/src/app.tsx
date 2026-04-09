import { QueryClientProvider } from "@tanstack/solid-query";
import { Route, Router } from "@solidjs/router";
import { Suspense } from "solid-js";
import { AppShell } from "./components/AppShell";
import { queryClient } from "./lib/query";
import AdminPage from "./routes/admin";
import ApplicationsPage from "./routes/applications";
import ChainsPage from "./routes/chains";
import DashboardPage from "./routes";
import EditEndpointPage from "./routes/endpoints/edit";
import EndpointsPage from "./routes/endpoints";
import NewEndpointPage from "./routes/endpoints/new";
import LoginPage from "./routes/login";
import ProvidersAdminPage from "./routes/providers-admin";
import "./app.css";

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router
        root={(props) => (
          <AppShell>
            <Suspense>{props.children}</Suspense>
          </AppShell>
        )}
      >
        <Route path="/" component={DashboardPage} />
        <Route path="/applications" component={ApplicationsPage} />
        <Route path="/chains" component={ChainsPage} />
        <Route path="/providers-admin" component={ProvidersAdminPage} />
        <Route path="/endpoints" component={EndpointsPage} />
        <Route path="/endpoints/new" component={NewEndpointPage} />
        <Route path="/endpoints/edit" component={EditEndpointPage} />
        <Route path="/admin" component={AdminPage} />
        <Route path="/login" component={LoginPage} />
      </Router>
    </QueryClientProvider>
  );
}
