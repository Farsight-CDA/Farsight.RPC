import { Router, Route } from "@solidjs/router";
import { AuthProvider, type AuthState } from "./lib/auth";
import RequireAuth from "./components/RequireAuth";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import ApplicationPage from "./pages/ApplicationPage";
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
            component={() => (
              <RequireAuth>
                <ApplicationDataProvider>
                  <ApplicationPage />
                </ApplicationDataProvider>
              </RequireAuth>
            )}
          />
        </Router>
      </ReferenceDataProvider>
    </AuthProvider>
  );
}
