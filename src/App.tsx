import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { lazy, Suspense, useEffect } from "react";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import Layout from "./components/Layout";
import ScrollToTopOnNav from "./components/ScrollToTopOnNav";
import { usePageTracking } from "./hooks/usePageTracking";
import { SidebarProvider } from "./context/SidebarContext";
import siteConfig from "./config/siteConfig";
import { AgentReadyWidget, UpdateBanner } from "@waynesutton/agent-ready/react";

// Mirror the widget's prop unions (not exported from the package entry point)
type WidgetPosition =
  | "footer"
  | "floating-bottom-right"
  | "floating-bottom-left"
  | "floating-center";
type WidgetTheme = "light" | "dark" | "system";

// Fallback widget settings used until the dashboard-controlled values load
const WIDGET_FALLBACK = {
  enabled: true,
  position: "floating-bottom-right",
  widgetTheme: "dark",
  defaultMobileCollapsed: true,
  showHumanTab: false,
  showMachineTab: true,
  showScoreTab: false,
  showChatLinks: false,
};

// Lazy load page components for better LCP and code splitting
const Home = lazy(() => import("./pages/Home"));
const Post = lazy(() => import("./pages/Post"));
const Stats = lazy(() => import("./pages/Stats"));
const Blog = lazy(() => import("./pages/Blog"));
const Projects = lazy(() => import("./pages/Projects"));
const DocsPage = lazy(() => import("./pages/DocsPage"));
const Write = lazy(() => import("./pages/Write"));
const TagPage = lazy(() => import("./pages/TagPage"));
const AuthorPage = lazy(() => import("./pages/AuthorPage"));
const Unsubscribe = lazy(() => import("./pages/Unsubscribe"));
const NewsletterAdmin = lazy(() => import("./pages/NewsletterAdmin"));
const Dashboard = lazy(() => import("./pages/Dashboard"));

// Minimal loading fallback to prevent layout shift
function PageSkeleton() {
  return <div style={{ minHeight: "100vh" }} />;
}

// Mirrors SIGN_IN_PENDING_KEY in src/pages/Dashboard.tsx. Set before the
// browser leaves for GitHub; sessionStorage survives the same-tab OAuth trip.
const DASHBOARD_SIGN_IN_PENDING_KEY = "dashboard-github-signin-pending";
const SIGN_IN_PENDING_MAX_AGE_MS = 10 * 60 * 1000;

function App() {
  // Track page views and active sessions
  usePageTracking();
  const location = useLocation();
  const navigate = useNavigate();
  const { isLoading: authLoading } = useConvexAuth();

  // Mobile OAuth recovery. Convex Auth carries redirectTo in a cross-site
  // cookie that mobile Safari often drops; when that happens the callback
  // falls back to the home page even though the sign-in itself succeeds.
  // A fresh pending marker means a dashboard sign-in is mid-flight, so once
  // the provider finishes the ?code= exchange, finish the trip to /dashboard.
  // The marker is left in place: the Dashboard gate consumes it and shows a
  // retry notice when the sign-in did not complete.
  useEffect(() => {
    if (location.pathname === "/dashboard") return;
    const startedAt = sessionStorage.getItem(DASHBOARD_SIGN_IN_PENDING_KEY);
    if (startedAt === null) return;
    if (Date.now() - Number(startedAt) > SIGN_IN_PENDING_MAX_AGE_MS) {
      sessionStorage.removeItem(DASHBOARD_SIGN_IN_PENDING_KEY);
      return;
    }
    if (authLoading) return;
    navigate("/dashboard", { replace: true });
  }, [authLoading, location.pathname, navigate]);

  // Dashboard-controlled widget settings; falls back to defaults while loading
  const widgetSettings =
    useQuery(api.agentReady.settings.getWidgetSettings) ?? WIDGET_FALLBACK;

  // Write page renders without Layout (no header, full-screen writing)
  if (location.pathname === "/write") {
    return (
      <Suspense fallback={<PageSkeleton />}>
        <Write />
      </Suspense>
    );
  }

  // Newsletter admin page renders without Layout (full-screen admin)
  if (location.pathname === "/newsletter-admin") {
    return (
      <Suspense fallback={<PageSkeleton />}>
        <NewsletterAdmin />
      </Suspense>
    );
  }

  // Dashboard renders without Layout (full-screen admin)
  if (location.pathname === "/dashboard") {
    return (
      <Suspense fallback={<PageSkeleton />}>
        <Dashboard />
      </Suspense>
    );
  }

  // Determine if we should use a custom homepage
  const useCustomHomepage = siteConfig.homepage.type !== "default" && siteConfig.homepage.slug;

  const configuredSiteUrl = import.meta.env.VITE_SITE_URL as string | undefined;
  const convexSiteUrl = import.meta.env.DEV
    ? (import.meta.env.VITE_CONVEX_SITE_URL as string | undefined)
    : undefined;
  const isLocalhost =
    typeof window !== "undefined" && ["localhost", "127.0.0.1"].includes(window.location.hostname);
  const appUrl = configuredSiteUrl || (isLocalhost ? convexSiteUrl : window.location.origin);

  return (
    <SidebarProvider>
      <ScrollToTopOnNav />
      <Layout>
        <Suspense fallback={<PageSkeleton />}>
          <Routes>
            {/* Homepage route - either default Home or custom page/post */}
            <Route
              path="/"
              element={
                useCustomHomepage ? (
                  <Post
                    slug={siteConfig.homepage.slug!}
                    isHomepage={true}
                    homepageType={
                      siteConfig.homepage.type === "default" ? undefined : siteConfig.homepage.type
                    }
                  />
                ) : (
                  <Home />
                )
              }
            />
            {/* Original homepage route (when custom homepage is set) */}
            {useCustomHomepage && (
              <Route path={siteConfig.homepage.originalHomeRoute || "/home"} element={<Home />} />
            )}
            {/* Stats page route - only enabled when statsPage.enabled is true */}
            {siteConfig.statsPage?.enabled && <Route path="/stats" element={<Stats />} />}
            {/* Unsubscribe route for newsletter */}
            <Route path="/unsubscribe" element={<Unsubscribe />} />
            {/* Blog page route - only enabled when blogPage.enabled is true */}
            {siteConfig.blogPage.enabled && <Route path="/blog" element={<Blog />} />}
            {/* Projects index route - only enabled when projectsPage.enabled is true */}
            {siteConfig.projectsPage?.enabled && (
              <Route path="/projects" element={<Projects />} />
            )}
            {/* Docs page route - only enabled when docsSection.enabled is true */}
            {siteConfig.docsSection?.enabled && (
              <Route path={`/${siteConfig.docsSection.slug}`} element={<DocsPage />} />
            )}
            {/* Tag page route - displays posts filtered by tag */}
            <Route path="/tags/:tag" element={<TagPage />} />
            {/* Author page route - displays posts by a specific author */}
            <Route path="/author/:authorSlug" element={<AuthorPage />} />
            {/* Catch-all for post/page slugs - must be last */}
            <Route path="/:slug" element={<Post />} />
          </Routes>
        </Suspense>
      </Layout>
      {appUrl && (
        <>
          <UpdateBanner appUrl={appUrl} />
          {/* Widget render settings are controlled live from the dashboard
              Agent Ready section (Convex agentReadySettings table) */}
          {widgetSettings.enabled && (
            <AgentReadyWidget
              appUrl={appUrl}
              publicAppUrl="https://waynesutton.ai"
              position={widgetSettings.position as WidgetPosition}
              theme={widgetSettings.widgetTheme as WidgetTheme}
              defaultMobileCollapsed={widgetSettings.defaultMobileCollapsed}
              showHumanTab={widgetSettings.showHumanTab}
              showMachineTab={widgetSettings.showMachineTab}
              showScoreTab={widgetSettings.showScoreTab}
              showChatLinks={widgetSettings.showChatLinks}
            />
          )}
        </>
      )}
    </SidebarProvider>
  );
}

export default App;
