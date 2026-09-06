import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { siteConfig, type Theme } from "../config/siteConfig";
import { detectModelContext, type ModelContextLike } from "../utils/webmcp/detect";
import { pageToolsFor } from "../utils/webmcp/catalog";
import { registerTools, type ToolHandler } from "../utils/webmcp/register";
import {
  getPageAction,
  mountedPageActions,
  subscribePageActions,
} from "../utils/webmcp/pageActions";
import type { WebMcpConfirmRequest } from "../components/WebMcpConfirmDialog";

interface UseWebMcpOptions {
  /** siteConfig.webmcp.enabled, resolved by the caller */
  enabled: boolean;
  /** Open the search modal with a query already typed */
  openSearch: (query: string) => void;
  setTheme: (theme: Theme) => void;
  /** Show the site confirm dialog. Resolves true when the person approves. */
  confirm: (request: WebMcpConfirmRequest) => Promise<boolean>;
}

const THEMES: ReadonlyArray<Theme> = ["dark", "light", "tan", "cloud"];
const RECENT_POSTS_MAX = 10;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Routes that render without Layout never reach this hook, but the list is
// explicit so a future refactor cannot register admin tools by accident
const SKIPPED_PREFIXES = ["/dashboard", "/write", "/newsletter-admin"];

function cleanString(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

/** Sorted key of mounted actions so useSyncExternalStore gets a stable snapshot */
function mountedKey(): string {
  return Array.from(mountedPageActions()).sort().join(",");
}

/**
 * Route scoped WebMCP registration. Detects the browser API once on the
 * client, subscribes to the public queries only when an agent surface exists,
 * and re-registers the tool list whenever the route or the mounted forms
 * change. Every handler reads live data through refs.
 */
export function useWebMcp({ enabled, openSearch, setTheme, confirm }: UseWebMcpOptions): void {
  const location = useLocation();
  const navigate = useNavigate();
  const [context, setContext] = useState<ModelContextLike | null>(null);

  const skipped = SKIPPED_PREFIXES.some((prefix) => location.pathname.startsWith(prefix));
  const active = enabled && !skipped && context !== null;

  // Client only detection, retried once shortly after mount because the
  // testing flag surface can attach after the first script runs
  useEffect(() => {
    if (!enabled || skipped) {
      setContext(null);
      return;
    }
    const found = detectModelContext();
    if (found) {
      setContext(found);
      return;
    }
    const timer = window.setTimeout(() => setContext(detectModelContext()), 500);
    return () => window.clearTimeout(timer);
  }, [enabled, skipped]);

  // Data for get_current_page, open_post, open_page, list_recent_posts.
  // "skip" keeps normal browsers free of extra subscriptions.
  const slug = location.pathname.replace(/^\//, "");
  const isCustomHome = location.pathname === "/" && siteConfig.homepage.type !== "default";
  const routeSlug = isCustomHome ? siteConfig.homepage.slug ?? "" : slug;
  const wantsDoc = active && routeSlug.length > 0 && !routeSlug.includes("/");
  const post = useQuery(api.posts.getPostBySlug, wantsDoc ? { slug: routeSlug } : "skip");
  const page = useQuery(api.pages.getPageBySlug, wantsDoc ? { slug: routeSlug } : "skip");
  const posts = useQuery(api.posts.getAllPosts, active ? {} : "skip");
  const pages = useQuery(api.pages.getAllPages, active ? {} : "skip");

  const mounted = useSyncExternalStore(subscribePageActions, mountedKey, () => "");

  // Latest values for handlers registered in an earlier effect run
  const live = useRef({ post, page, posts, pages, pathname: location.pathname, openSearch, setTheme, confirm, navigate });
  live.current = { post, page, posts, pages, pathname: location.pathname, openSearch, setTheme, confirm, navigate };

  useEffect(() => {
    if (!active || !context) {
      return;
    }
    const tools = pageToolsFor(mountedPageActions());

    const handlers: Record<string, ToolHandler> = {
      search_site: (input) => {
        const query = cleanString(input.query, 200);
        if (!query) {
          return { ok: false, reason: "query is required" };
        }
        live.current.openSearch(query);
        return { ok: true, message: `Search opened for "${query}"` };
      },

      get_current_page: () => {
        const { post: current, page: currentPage, pathname } = live.current;
        if (current && !current.unlisted) {
          return {
            type: "post",
            slug: current.slug,
            title: current.title,
            description: current.description,
            date: current.date,
            tags: current.tags,
            readTime: current.readTime ?? null,
            url: `${window.location.origin}/${current.slug}`,
            markdownUrl: `${window.location.origin}/raw/${current.slug}.md`,
          };
        }
        if (currentPage && !currentPage.unlisted) {
          return {
            type: "page",
            slug: currentPage.slug,
            title: currentPage.title,
            description: currentPage.excerpt ?? null,
            url: `${window.location.origin}/${currentPage.slug}`,
          };
        }
        return {
          type: "route",
          path: pathname,
          title: document.title,
          site: siteConfig.name,
        };
      },

      list_recent_posts: (input) => {
        const raw = typeof input.limit === "number" ? Math.floor(input.limit) : RECENT_POSTS_MAX;
        const limit = Math.min(Math.max(raw, 1), RECENT_POSTS_MAX);
        const list = live.current.posts ?? [];
        return list.slice(0, limit).map((item) => ({
          slug: item.slug,
          title: item.title,
          description: item.description,
          date: item.date,
          tags: item.tags,
          url: `${window.location.origin}/${item.slug}`,
        }));
      },

      open_post: (input) => {
        const target = cleanString(input.slug, 200).replace(/^\//, "");
        const list = live.current.posts;
        if (!target) {
          return { ok: false, reason: "slug is required" };
        }
        if (!list) {
          return { ok: false, reason: "Post list is still loading, try again" };
        }
        // getAllPosts already excludes unlisted and unpublished posts
        if (!list.some((item) => item.slug === target)) {
          return { ok: false, reason: "No published post with that slug" };
        }
        live.current.navigate(`/${target}`);
        return { ok: true, message: `Opened /${target}` };
      },

      open_page: (input) => {
        const target = cleanString(input.slug, 200).replace(/^\//, "");
        const list = live.current.pages;
        if (!target) {
          return { ok: false, reason: "slug is required" };
        }
        if (!list) {
          return { ok: false, reason: "Page list is still loading, try again" };
        }
        if (!list.some((item) => item.slug === target)) {
          return { ok: false, reason: "No published page with that slug" };
        }
        live.current.navigate(`/${target}`);
        return { ok: true, message: `Opened /${target}` };
      },

      set_theme: (input) => {
        const theme = cleanString(input.theme, 20) as Theme;
        if (!THEMES.includes(theme)) {
          return { ok: false, reason: `theme must be one of ${THEMES.join(", ")}` };
        }
        live.current.setTheme(theme);
        return { ok: true, message: `Theme set to ${theme}` };
      },

      subscribe_newsletter: async (input) => {
        const action = getPageAction("newsletter");
        if (!action) {
          return { ok: false, reason: "The newsletter form is not on this page" };
        }
        const email = cleanString(input.email, 254);
        if (!EMAIL_PATTERN.test(email)) {
          return { ok: false, reason: "A valid email is required" };
        }
        const approved = await live.current.confirm({
          tool: "subscribe_newsletter",
          title: "Subscribe to the newsletter?",
          description: "An agent in this tab wants to subscribe this address.",
          details: [{ label: "Email", value: email }],
          confirmLabel: "Subscribe",
        });
        if (!approved) {
          return { ok: false, reason: "cancelled" };
        }
        return await action({ email });
      },

      submit_contact: async (input) => {
        const action = getPageAction("contact");
        if (!action) {
          return { ok: false, reason: "The contact form is not on this page" };
        }
        const name = cleanString(input.name, 200);
        const email = cleanString(input.email, 254);
        const message = cleanString(input.message, 5000);
        if (!name || !message || !EMAIL_PATTERN.test(email)) {
          return { ok: false, reason: "name, a valid email, and message are required" };
        }
        const approved = await live.current.confirm({
          tool: "submit_contact",
          title: "Send this message?",
          description: "An agent in this tab filled the contact form. Check it before it goes out.",
          details: [
            { label: "Name", value: name },
            { label: "Email", value: email },
            { label: "Message", value: message },
          ],
          confirmLabel: "Send message",
        });
        if (!approved) {
          return { ok: false, reason: "cancelled" };
        }
        return await action({ name, email, message });
      },

      listen_to_post: async () => {
        const action = getPageAction("listen");
        if (!action) {
          return { ok: false, reason: "This post has no audio player" };
        }
        return await action();
      },
    };

    return registerTools(context, tools, handlers);
    // `mounted` is the external store key: it changes when a form mounts or
    // unmounts and that is exactly when the tool list needs to change
  }, [active, context, location.pathname, mounted]);
}
