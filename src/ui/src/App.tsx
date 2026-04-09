import { Router, Route } from "@solidjs/router";
import { AuthProvider } from "./lib/auth";
import RequireAuth from "./components/RequireAuth";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import ApplicationPage from "./pages/ApplicationPage";

export default function App() {
  return (
    <AuthProvider>
      <Router root={(props) => <>{props.children}</>}>
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
              <ApplicationPage />
            </RequireAuth>
          )}
        />
      </Router>
    </AuthProvider>
  );
}
