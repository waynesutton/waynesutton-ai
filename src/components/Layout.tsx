import { ReactNode, useState, useEffect, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { MagnifyingGlass, SignIn, Sparkle } from "@phosphor-icons/react";
import ThemeToggle from "./ThemeToggle";
import FontToggle from "./FontToggle";
import SearchModal from "./SearchModal";
import AskAIModal from "./AskAIModal";
import MobileMenu, { HamburgerButton } from "./MobileMenu";
import ScrollToTop, { ScrollToTopConfig } from "./ScrollToTop";
import WebMcpProvider from "./WebMcpProvider";
import { useSidebarOptional } from "../context/SidebarContext";
import siteConfig from "../config/siteConfig";
import { platformIcons } from "./SocialFooter";
import { useSocialFooter } from "../hooks/useSocialFooter";
import {
  categoryNavItems,
  resolveHomeCategories,
} from "../utils/homeCategories";

// Scroll-to-top configuration - enabled by default
// Customize threshold (pixels) to control when button appears
const scrollToTopConfig: Partial<ScrollToTopConfig> = {
  enabled: true, // Set to false to disable
  threshold: 300, // Show after scrolling 300px
  smooth: true, // Smooth scroll animation
};

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  // Fetch published pages for navigation
  const pages = useQuery(api.pages.getAllPages);
  const isDashboardAdmin = useQuery(api.authAdmin.isCurrentUserDashboardAdmin);
  const configOverrides = useQuery(api.siteConfigData.getOverrides);
  const homeCategories = resolveHomeCategories(configOverrides);
  const socialFooter = useSocialFooter();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  // Query typed into the search box on open. Only the WebMCP search_site
  // tool sets it; the header button always opens blank.
  const [searchInitialQuery, setSearchInitialQuery] = useState("");
  const [isAskAIOpen, setIsAskAIOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Fetch docs pages and posts for detecting if current page is in docs section
  const docsPages = useQuery(api.pages.getDocsPages);
  const docsPosts = useQuery(api.posts.getDocsPosts);

  // Check if current page is a docs page
  const currentSlug = location.pathname.replace(/^\//, "");
  const docsSlug = siteConfig.docsSection?.slug || "docs";
  const isDocsLanding = currentSlug === docsSlug;
  const isDocsPage =
    isDocsLanding ||
    (docsPages?.some((p) => p.slug === currentSlug) ?? false) ||
    (docsPosts?.some((p) => p.slug === currentSlug) ?? false);

  // Get sidebar headings from context (if available)
  const sidebarContext = useSidebarOptional();
  const sidebarHeadings = sidebarContext?.headings || [];
  const sidebarActiveId = sidebarContext?.activeId;
  // Per-post hideNav frontmatter: the top nav scrolls away with the page on that post
  const hideNav = sidebarContext?.hideNav === true;

  // Open search modal
  const openSearch = useCallback(() => {
    setSearchInitialQuery("");
    setIsSearchOpen(true);
  }, []);

  // Open search with a query already typed (WebMCP search_site)
  const openSearchWithQuery = useCallback((query: string) => {
    setSearchInitialQuery(query);
    setIsSearchOpen(true);
  }, []);

  // Close search modal
  const closeSearch = useCallback(() => {
    setIsSearchOpen(false);
  }, []);

  // Open Ask AI modal
  const openAskAI = useCallback(() => {
    setIsAskAIOpen(true);
  }, []);

  // Close Ask AI modal
  const closeAskAI = useCallback(() => {
    setIsAskAIOpen(false);
  }, []);

  // Mobile menu handlers
  const openMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(true);
  }, []);

  const closeMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Handle Command+K / Ctrl+K keyboard shortcut for search
  // Handle Command+J / Ctrl+J / Command+/ keyboard shortcut for Ask AI
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Command+K on Mac, Ctrl+K on Windows/Linux (Search)
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchInitialQuery("");
        setIsSearchOpen((prev) => !prev);
      }
      // Command+J or Command+/ on Mac, Ctrl+J or Ctrl+/ on Windows/Linux (Ask AI)
      if ((e.metaKey || e.ctrlKey) && (e.key === "j" || e.key === "/")) {
        e.preventDefault();
        // Only toggle if Ask AI is enabled
        if (siteConfig.askAI?.enabled && siteConfig.semanticSearch?.enabled) {
          setIsAskAIOpen((prev) => !prev);
        }
      }
      // Also close on Escape
      if (e.key === "Escape") {
        if (isSearchOpen) setIsSearchOpen(false);
        if (isAskAIOpen) setIsAskAIOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isSearchOpen, isAskAIOpen]);

  // Check if Blog link should be shown in nav
  const showBlogInNav =
    siteConfig.blogPage.enabled && siteConfig.blogPage.showInNav;

  // Combine Blog link, hardcoded nav items, and pages, then sort by order
  // This allows all nav items to be positioned anywhere via order field
  type NavItem = {
    slug: string;
    title: string;
    order: number;
    isBlog?: boolean;
  };

  const navItems: NavItem[] = [];

  // Add Blog link if enabled
  if (showBlogInNav) {
    navItems.push({
      slug: "blog",
      title: siteConfig.blogPage.title,
      order: siteConfig.blogPage.order ?? 0,
      isBlog: true,
    });
  }

  // Add Projects link if enabled
  if (
    siteConfig.projectsPage?.enabled &&
    siteConfig.projectsPage?.showInNav
  ) {
    navItems.push({
      slug: "projects",
      title: siteConfig.projectsPage.title,
      order: siteConfig.projectsPage.order ?? 3,
    });
  }

  // Add Skills link if enabled
  if (siteConfig.skillsPage?.enabled && siteConfig.skillsPage?.showInNav) {
    navItems.push({
      slug: "skills",
      title: siteConfig.skillsPage.title,
      order: siteConfig.skillsPage.order ?? 4,
    });
  }

  // Add Photos link if enabled
  if (siteConfig.photosPage?.enabled && siteConfig.photosPage?.showInNav) {
    navItems.push({
      slug: "photos",
      title: siteConfig.photosPage.title,
      order: siteConfig.photosPage.order ?? 5,
    });
  }

  // Add Docs link if enabled
  if (siteConfig.docsSection?.enabled && siteConfig.docsSection?.showInNav) {
    navItems.push({
      slug: siteConfig.docsSection.slug,
      title: siteConfig.docsSection.title,
      order: siteConfig.docsSection.order ?? 1,
    });
  }

  // Category sections opted into nav, same list as Blog. Live overrides win.
  for (const item of categoryNavItems(homeCategories)) {
    navItems.push(item);
  }

  if (siteConfig.statsPage?.enabled && siteConfig.statsPage.showInNav &&
      !siteConfig.hardcodedNavItems?.some((item) => item.slug === "stats")) {
    navItems.push({ slug: "stats", title: "Stats", order: 10 });
  }

  // Add hardcoded nav items (React routes like /stats, /write)
  if (siteConfig.hardcodedNavItems && siteConfig.hardcodedNavItems.length > 0) {
    siteConfig.hardcodedNavItems.forEach((item) => {
      // Skip stats nav item if stats page is disabled
      if (item.slug === "stats" && (!siteConfig.statsPage?.enabled || !siteConfig.statsPage.showInNav)) {
        return;
      }
      // Only add if showInNav is true (defaults to true)
      if (item.showInNav !== false) {
        navItems.push({
          slug: item.slug,
          title: item.title,
          order: item.order ?? 999,
        });
      }
    });
  }

  // Add dashboard link for admins when enabled and configured to show in nav.
  const dashboardEnabled = siteConfig.dashboard?.enabled ?? true;
  const dashboardShowInNav = siteConfig.dashboard?.showInNav ?? true;
  const dashboardRequiresAuth = siteConfig.dashboard?.requireAuth ?? true;
  const canShowDashboardNav =
    dashboardEnabled &&
    dashboardShowInNav &&
    (!dashboardRequiresAuth || isDashboardAdmin === true);
  if (canShowDashboardNav) {
    navItems.push({
      slug: "dashboard",
      title: "Dashboard",
      order: 21, // Keeps Dashboard next to Write by default
    });
  }

  // Add pages from Convex
  if (pages && pages.length > 0) {
    pages.forEach((page) => {
      navItems.push({
        slug: page.slug,
        title: page.title,
        order: page.order ?? 999,
      });
    });
  }

  // Sort by order (lower numbers first), then alphabetically by title
  navItems.sort((a, b) => {
    if (a.order !== b.order) return a.order - b.order;
    return a.title.localeCompare(b.title);
  });

  return (
    <div className="layout">
      {/* Top navigation bar with logo, page links, search, and theme toggle */}
      {/* hideNav: true switches it from fixed to absolute so it scrolls away with the page */}
      <div className={hideNav ? "top-nav top-nav-scroll" : "top-nav"}>
        {/* Logo on the left (visible on all pages) */}
        {siteConfig.innerPageLogo.enabled && siteConfig.logo && (
          <Link to="/" className="top-nav-logo-link">
            <img
              src={siteConfig.logo}
              alt={siteConfig.name}
              className="top-nav-logo"
              width={siteConfig.innerPageLogo.size}
              height={siteConfig.innerPageLogo.size}
              style={{ height: siteConfig.innerPageLogo.size, width: "auto" }}
            />
          </Link>
        )}

        {/* Mobile left controls: hamburger, search, theme (visible on mobile/tablet only) */}
        {/* Note: Social icons are in the hamburger menu (MobileMenu.tsx), not in the mobile header */}
        <div className="mobile-nav-controls">
          {/* Hamburger button for mobile menu */}
          <HamburgerButton onClick={openMobileMenu} isOpen={isMobileMenuOpen} />
          {/* Dashboard entry icon: only when showInNav is on and the text link is not already rendered (e.g. signed out) */}
          {dashboardEnabled && dashboardShowInNav && !canShowDashboardNav && (
            <Link
              to="/dashboard"
              className="search-button dashboard-nav-link"
              aria-label="Dashboard"
              title="Dashboard"
            >
              <SignIn size={18} weight="bold" />
              <span className="dashboard-icon-label">Dashboard</span>
            </Link>
          )}
          {/* Ask AI button (only if enabled) */}
          {siteConfig.askAI?.enabled && siteConfig.semanticSearch?.enabled && (
            <button
              onClick={openAskAI}
              className="ask-ai-button"
              aria-label="Ask AI (⌘J)"
              title="Ask AI (⌘J)"
            >
              <Sparkle size={18} weight="bold" />
            </button>
          )}
          {/* Search button with icon */}
          <button
            onClick={openSearch}
            className="search-button"
            aria-label="Search (⌘K)"
            title="Search (⌘K)"
          >
            <MagnifyingGlass size={18} weight="bold" />
          </button>
          {/* Font toggle */}
          <FontToggle />
          {/* Theme toggle */}
          <div className="theme-toggle-container">
            <ThemeToggle />
          </div>
        </div>

        {/* Page navigation links (visible on desktop only) */}
        <nav className="page-nav desktop-only">
          {/* Nav links sorted by order (Blog + pages combined) */}
          {navItems.map((item) => {
            const href = `/${item.slug}`;
            const isCurrent = location.pathname === href;
            return (
              <Link
                key={item.slug}
                to={href}
                className="page-nav-link"
                aria-current={isCurrent ? "page" : undefined}
              >
                {item.title}
              </Link>
            );
          })}
        </nav>

        {/* Desktop search and theme (visible on desktop only) */}
        <div className="desktop-controls desktop-only">
          {/* Dashboard entry icon: only when showInNav is on and the text link is not already rendered (e.g. signed out) */}
          {dashboardEnabled && dashboardShowInNav && !canShowDashboardNav && (
            <Link
              to="/dashboard"
              className="search-button dashboard-nav-link"
              aria-label="Dashboard"
              title="Dashboard"
            >
              <SignIn size={18} weight="bold" />
              <span className="dashboard-icon-label">Dashboard</span>
            </Link>
          )}
          {/* Social icons in header (if enabled) */}
          {socialFooter.enabled && socialFooter.showInHeader && (
              <div className="header-social-links">
                {socialFooter.socialLinks.map((link, index) => {
                  const IconComponent = platformIcons[link.platform];
                  return (
                    <a
                      key={`${link.platform}-${index}`}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="header-social-link"
                      aria-label={`Follow on ${link.platform}`}
                    >
                      <IconComponent size={18} weight="regular" />
                    </a>
                  );
                })}
              </div>
            )}
          {/* Ask AI button (before search, only if enabled) */}
          {siteConfig.askAI?.enabled && siteConfig.semanticSearch?.enabled && (
            <button
              onClick={openAskAI}
              className="ask-ai-button"
              aria-label="Ask AI (⌘J)"
              title="Ask AI (⌘J)"
            >
              <Sparkle size={18} weight="bold" />
            </button>
          )}
          {/* Search button with icon */}
          <button
            onClick={openSearch}
            className="search-button"
            aria-label="Search (⌘K)"
            title="Search (⌘K)"
          >
            <MagnifyingGlass size={18} weight="bold" />
          </button>
          {/* Font toggle */}
          <FontToggle />
          {/* Theme toggle */}
          <div className="theme-toggle-container">
            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* Mobile menu drawer */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={closeMobileMenu}
        sidebarHeadings={sidebarHeadings}
        sidebarActiveId={sidebarActiveId}
        showDocsNav={isDocsPage}
        currentDocsSlug={currentSlug}
      >
        {/* Page navigation links in mobile menu (same order as desktop) */}
        <nav className="mobile-nav-links">
          {navItems.map((item) => {
            const href = `/${item.slug}`;
            const isCurrent = location.pathname === href;
            return (
              <Link
                key={item.slug}
                to={href}
                className="mobile-nav-link"
                aria-current={isCurrent ? "page" : undefined}
                onClick={closeMobileMenu}
              >
                {item.title}
              </Link>
            );
          })}
        </nav>
      </MobileMenu>

      {/* Wider column for stats, blog, tag archives, photos, and docs */}
      <main
        className={
          location.pathname === "/stats" ||
          location.pathname === "/blog" ||
          location.pathname.startsWith("/tags/") ||
          location.pathname === "/photos" ||
          location.pathname.startsWith("/photos/") ||
          isDocsPage
            ? "main-content-wide"
            : "main-content"
        }
      >
        {children}
      </main>

      {/* Search modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={closeSearch}
        initialQuery={searchInitialQuery}
      />

      {/* WebMCP: in-page tools for Chrome agents, no-op elsewhere */}
      <WebMcpProvider openSearch={openSearchWithQuery} />

      {/* Ask AI modal */}
      {siteConfig.askAI?.enabled && siteConfig.semanticSearch?.enabled && (
        <AskAIModal isOpen={isAskAIOpen} onClose={closeAskAI} />
      )}

      {/* Scroll to top button */}
      <ScrollToTop config={scrollToTopConfig} />
    </div>
  );
}
