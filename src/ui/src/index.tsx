/* @refresh reload */
import "./index.css";
import { render } from "solid-js/web";
import App from "./App";
import { loadStoredAuth } from "./lib/auth";
import {
  preloadReferenceData,
  type ReferenceDataSnapshot,
} from "./lib/reference-data";

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found");

async function bootstrap() {
  const initialAuthState = loadStoredAuth();
  let initialReferenceData: ReferenceDataSnapshot | undefined;

  if (initialAuthState.token) {
    try {
      initialReferenceData = await preloadReferenceData(initialAuthState.token);
    } catch {}
  }

  render(
    () => (
      <App
        initialAuthState={initialAuthState}
        initialReferenceData={initialReferenceData}
      />
    ),
    rootElement!,
  );
}

void bootstrap();
