import { Router, Route, type RouteSectionProps } from "@solidjs/router";
import { JSX } from "solid-js";
import { AuthProvider, type AuthState } from "./lib/auth";
import RequireAuth from "./components/RequireAuth";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import ApplicationLayout from "./pages/ApplicationLayout";
import ApplicationRpcsPage from "./pages/ApplicationRpcsPage";
import ApplicationApiKeysPage from "./pages/ApplicationApiKeysPage";
import ApplicationGeneralPage from "./pages/ApplicationGeneralPage";
import ApplicationProvidersPage from "./pages/ApplicationProvidersPage";
import {
  ReferenceDataProvider,
  type ReferenceDataSnapshot,
} from "./lib/reference-data";
import { ApplicationDataProvider } from "./lib/application-data";

type AppProps = {
  initialAuthState?: AuthState;
  initialReferenceData?: ReferenceDataSnapshot;
};

export default function App(props: AppProps) {
  return (
    <AuthProvider initialState={props.initialAuthState}>
      <ReferenceDataProvider
        initialData={props.initialReferenceData}
        initialToken={props.initialAuthState?.token ?? null}
      >
        <Router root={(routeProps) => <>{routeProps.children}</>}>
          <Route path="/login" component={LoginPage} />
          <Route
            path="/"
            component={() => (
              <RequireAuth>
                <DashboardPage />
              </RequireAuth>
            )}
          />
          <Route
            path="/applications/:applicationId"
            component={(props: RouteSectionProps) => (
              <RequireAuth>
                <ApplicationDataProvider>
                  <ApplicationLayout>{props.children}</ApplicationLayout>
                </ApplicationDataProvider>
              </RequireAuth>
            )}
          >
            <Route path="/" component={ApplicationRpcsPage} />
            <Route path="/rpcs" component={ApplicationRpcsPage} />
            <Route path="/api-keys" component={ApplicationApiKeysPage} />
            <Route path="/general" component={ApplicationGeneralPage} />
            <Route path="/providers" component={ApplicationProvidersPage} />
          </Route>
        </Router>
      </ReferenceDataProvider>
    </AuthProvider>
  );
}
