import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ConvexReactClient } from "convex/react";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ThemeProvider } from "./context/ThemeContext";
import { FontProvider } from "./context/FontContext";
import App from "./App";
import "./styles/global.css";

// Disable browser scroll restoration to prevent scroll position being restored on navigation
if ("scrollRestoration" in window.history) {
  window.history.scrollRestoration = "manual";
}

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL);

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
