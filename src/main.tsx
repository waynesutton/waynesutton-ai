import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ConvexReactClient } from "convex/react";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ThemeProvider } from "./context/ThemeContext";
import { FontProvider } from "./context/FontContext";
import { api } from "../convex/_generated/api";
import siteConfig from "./config/siteConfig";
import { applyRuntimeConfigOverrides } from "./config/runtimeConfig";
import App from "./App";
import "./styles/global.css";

// Disable browser scroll restoration to prevent scroll position being restored on navigation
if ("scrollRestoration" in window.history) {
  window.history.scrollRestoration = "manual";
}

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL);

// Load dashboard-saved config overrides before first render so components see
// merged values immediately. Capped at 3s; on timeout or error the site renders
// with the static siteConfig.ts values.
async function loadConfigOverrides(): Promise<void> {
  try {
    const overrides = await Promise.race([
      convex.query(api.siteConfigData.getOverrides, {}),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000)),
    ]);
    if (overrides) {
      applyRuntimeConfigOverrides(siteConfig, overrides);
    }
  } catch {
    // Static config is the fallback
  }
}

function renderApp(): void {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <ConvexAuthProvider
        client={convex}
        replaceURL={(relativeUrl) => {
          window.history.replaceState(window.history.state, "", relativeUrl);
        }}
      >
        {/* React Router 7: the old v7 future flags are now default behavior */}
        <BrowserRouter>
          <ThemeProvider>
            <FontProvider>
              <App />
            </FontProvider>
          </ThemeProvider>
        </BrowserRouter>
      </ConvexAuthProvider>
    </StrictMode>,
  );
}

void loadConfigOverrides().finally(renderApp);
