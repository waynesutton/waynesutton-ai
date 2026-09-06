import { useState, useEffect, useCallback, useRef, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import {
  CopySimple,
  Check,
  Trash,
  DownloadSimple,
  House,
  Article,
  File,
  Warning,
  TextAa,
  ChatCircle,
  ArrowsOut,
  ArrowsIn,
  SidebarSimple,
} from "@phosphor-icons/react";
import { Moon, Sun, Cloud } from "lucide-react";
import { Half2Icon } from "@radix-ui/react-icons";
import { useTheme } from "../context/ThemeContext";
import { useFont } from "../context/FontContext";
import AIChatView from "../components/AIChatView";
import siteConfig from "../config/siteConfig";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { FrontmatterForm, createDefaultFrontmatter, serializeFrontmatter, type FrontmatterImageField } from "../components/FrontmatterForm";
import { ImageUploadModal } from "../components/ImageUploadModal";
import { TooltipProvider, Tip } from "../components/ui/Tooltip";
import { collectAuthorSuggestions } from "../utils/authorSuggestions";
import { parseWriteFrontmatter, patchWriteFrontmatter } from "../utils/writeFrontmatter";
import { FRONTMATTER_SIDEBAR_WIDTH_KEY, useResizableSidebar } from "../hooks/useResizableSidebar";
import "../styles/dashboard-forms.css";
import "../styles/dashboard.css";
import "../styles/write-workspace.css";

// A local draft starts unpublished. Switching type retains its contents.
function generateTemplate(type: "post" | "page"): string {
  return serializeFrontmatter(type, { ...createDefaultFrontmatter(type), published: false }) + "\n";
}

// localStorage keys
const STORAGE_KEY_CONTENT = "markdown_write_content";
const STORAGE_KEY_TYPE = "markdown_write_type";
const STORAGE_KEY_FONT = "markdown_write_font";
const STORAGE_KEY_SIDEBAR = "markdown_write_sidebar_collapsed";
const STORAGE_KEY_FOCUS = "markdown_write_focus_mode";
const STORAGE_KEY_FRONTMATTER = "markdown_write_frontmatter_collapsed";

// Font family definitions (matches global.css options)
// Note: Write page uses its own font state for local editing, but respects global font on mount
const FONTS: Record<"serif" | "sans" | "monospace", string> = {
  serif:
    '"New York", -apple-system-ui-serif, ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
  sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif',
  monospace: '"IBM Plex Mono", "Liberation Mono", ui-monospace, monospace',
};

// Get the appropriate icon for current theme (matches ThemeToggle.tsx)
function getThemeIcon(theme: string) {
  switch (theme) {
    case "dark":
      return <Moon size={18} />;
    case "light":
      return <Sun size={18} />;
    case "tan":
      return <Half2Icon style={{ width: 18, height: 18 }} />;
    case "cloud":
      return <Cloud size={18} />;
    default:
      return <Sun size={18} />;
  }
}

export default function Write() {
  const { theme, toggleTheme } = useTheme();
  const { fontFamily: globalFont } = useFont();
  const [contentType, setContentType] = useState<"post" | "page">(() => localStorage.getItem(STORAGE_KEY_TYPE) === "page" ? "page" : "post");
  const [content, setContent] = useState(() => localStorage.getItem(STORAGE_KEY_CONTENT) ?? generateTemplate(contentType));
  const [copied, setCopied] = useState(false);
  const isAdmin = useQuery(api.authAdmin.isCurrentUserDashboardAdmin) === true;
  const authorsPosts = useQuery(api.posts.listAll, isAdmin ? {} : "skip");
  const authorsPages = useQuery(api.pages.listAll, isAdmin ? {} : "skip");
  const authorSuggestions = collectAuthorSuggestions([...(authorsPosts ?? []), ...(authorsPages ?? [])]);
  const [imageField, setImageField] = useState<FrontmatterImageField | null>(null);
  const [imageTab, setImageTab] = useState<"upload" | "library">("library");
  const [confirmReset, setConfirmReset] = useState(false);
  const parsed = parseWriteFrontmatter(content, contentType);
  const [font, setFont] = useState<"serif" | "sans" | "monospace">("sans");
  const [isAIChatMode, setIsAIChatMode] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY_SIDEBAR);
    return saved === "true";
  });
  const [focusMode, setFocusMode] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY_FOCUS);
    return saved === "true";
  });
  const [frontmatterCollapsed, setFrontmatterCollapsed] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY_FRONTMATTER);
    return saved === "true";
  });
  const sidebar = useResizableSidebar(FRONTMATTER_SIDEBAR_WIDTH_KEY);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const settingsRef = useRef<HTMLElement>(null);
  const resetDialogRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!confirmReset) return;
    const previousFocus = document.activeElement;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); setConfirmReset(false); }
      if (event.key !== "Tab") return;
      const buttons = resetDialogRef.current?.querySelectorAll<HTMLButtonElement>("button");
      if (!buttons?.length) return;
      const first = buttons[0];
      const last = buttons[buttons.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    };
  }, [confirmReset]);

  // Check if AI chat is enabled for write page
  const aiChatEnabled = siteConfig.aiChat.enabledOnWritePage;

  // Load from localStorage on mount
  useEffect(() => {
    const savedFont = localStorage.getItem(STORAGE_KEY_FONT) as
      | "serif"
      | "sans"
      | "monospace"
      | null;

    // Use saved font preference, or fall back to global font, or default to sans
    if (
      savedFont &&
      (savedFont === "serif" ||
        savedFont === "sans" ||
        savedFont === "monospace")
    ) {
      setFont(savedFont);
    } else if (
      globalFont === "serif" ||
      globalFont === "sans" ||
      globalFont === "monospace"
    ) {
      // Sync with global font on first load
      setFont(globalFont);
    } else {
      // Default to sans if no saved preference and global font is not valid
      setFont("sans");
    }
  }, [globalFont]);

  // Save to localStorage on content change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_CONTENT, content);
  }, [content]);

  // Save type to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_TYPE, contentType);
  }, [contentType]);

  // Save font preference to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_FONT, font);
  }, [font]);

  // Prevent scroll when switching to AI chat mode
  useEffect(() => {
    // Lock scroll position to prevent jump when AI chat mounts
    window.scrollTo(0, 0);
  }, [isAIChatMode]);

  // Toggle font between serif, sans-serif, and monospace
  const toggleFont = useCallback(() => {
    setFont((prev) => {
      if (prev === "serif") return "sans";
      if (prev === "sans") return "monospace";
      return "serif";
    });
  }, []);

  // Toggle sidebar collapsed state
  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => {
      const newValue = !prev;
      localStorage.setItem(STORAGE_KEY_SIDEBAR, String(newValue));
      return newValue;
    });
  }, []);

  // Toggle focus mode (hides sidebars and header for distraction-free writing)
  const toggleFocusMode = useCallback(() => {
    setFocusMode((prev) => {
      const newValue = !prev;
      localStorage.setItem(STORAGE_KEY_FOCUS, String(newValue));
      // When entering focus mode, collapse frontmatter by default
      if (newValue) {
        setFrontmatterCollapsed(true);
        localStorage.setItem(STORAGE_KEY_FRONTMATTER, "true");
      }
      return newValue;
    });
  }, []);

  // Toggle frontmatter sidebar
  const toggleFrontmatter = useCallback(() => {
    setFrontmatterCollapsed((prev) => {
      const newValue = !prev;
      localStorage.setItem(STORAGE_KEY_FRONTMATTER, String(newValue));
      return newValue;
    });
  }, []);

  const openSettings = () => {
    if (window.matchMedia("(max-width: 1100px)").matches) {
      setFrontmatterCollapsed(false);
      localStorage.setItem(STORAGE_KEY_FRONTMATTER, "false");
      requestAnimationFrame(() => {
        settingsRef.current?.scrollIntoView({ block: "start", behavior: "auto" });
        settingsRef.current?.focus({ preventScroll: true });
      });
    } else {
      toggleFrontmatter();
    }
  };

  // Keyboard shortcut: Cmd+. to toggle sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === ".") {
        e.preventDefault();
        toggleSidebar();
      }
      // Escape to exit focus mode
      if (e.key === "Escape" && focusMode && !confirmReset) {
        e.preventDefault();
        toggleFocusMode();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [toggleSidebar, toggleFocusMode, focusMode, confirmReset]);

  // Handle type change and update content template
  const handleTypeChange = (newType: "post" | "page") => {
    if (newType === contentType) return;

    setContentType(newType);
    // Preserve the draft when switching its publishing destination.
  };

  // Copy content to clipboard
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = content;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [content]);

  const handleDownload = () => {
    const url = URL.createObjectURL(new Blob([content], { type: "text/markdown" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${parsed.values.slug.replace(/[^a-z0-9-]/gi, "") || "draft"}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Clear content and reset to template
  const handleClear = useCallback(() => {
    setContent(generateTemplate(contentType));
    setConfirmReset(false);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [contentType]);

  // Calculate stats
  const lines = content.split("\n").length;
  const characters = content.length;
  const words = content.trim() ? content.trim().split(/\s+/).length : 0;


  return (
    // FrontmatterForm renders Radix tooltips, which need a provider above them
    <TooltipProvider delayDuration={350} skipDelayDuration={400}>
    <div
      className={`write-layout write-workspace ${sidebarCollapsed ? "sidebar-collapsed" : ""} ${focusMode ? "focus-mode" : ""} ${frontmatterCollapsed ? "frontmatter-collapsed" : ""}`}
      style={
        frontmatterCollapsed
          ? undefined
          : ({ "--write-fm-width": `${sidebar.width}px` } as CSSProperties)
      }
    >
      {/* Left Sidebar: Type selector */}
      <aside
        className={`write-sidebar-left ${sidebarCollapsed ? "collapsed" : ""}`}
      >
        <div className="write-sidebar-header">
          <Link to="/" className="write-logo-link" title="Back to home">
            <House size={20} weight="regular" />
            <span>Home</span>
          </Link>
          <button
            className="write-sidebar-toggle"
            onClick={toggleSidebar}
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <SidebarSimple size={20} weight="regular" />
          </button>
        </div>

        <nav className="write-nav">
          <div className="write-nav-section">
            <span className="write-nav-label">Content Type</span>
            <button
              onClick={() => handleTypeChange("post")}
              className={`write-nav-item ${contentType === "post" ? "active" : ""}`}
            >
              <Article
                size={18}
                weight={contentType === "post" ? "fill" : "regular"}
              />
              <span>Blog Post</span>
            </button>
            <button
              onClick={() => handleTypeChange("page")}
              className={`write-nav-item ${contentType === "page" ? "active" : ""}`}
            >
              <File
                size={18}
                weight={contentType === "page" ? "fill" : "regular"}
              />
              <span>Page</span>
            </button>
          </div>

          <div className="write-nav-section">
            <span className="write-nav-label">Actions</span>
            {/* AI Chat toggle - only show if enabled in siteConfig */}
            {aiChatEnabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  // Prevent any scroll behavior during mode switch
                  const scrollX = window.scrollX;
                  const scrollY = window.scrollY;
                  setIsAIChatMode(!isAIChatMode);
                  // Restore scroll position immediately after state change
                  requestAnimationFrame(() => {
                    window.scrollTo(scrollX, scrollY);
                  });
                }}
                className={`write-nav-item ${isAIChatMode ? "active" : ""}`}
                title={
                  isAIChatMode ? "Switch to text editor" : "Switch to AI Chat"
                }
              >
                <ChatCircle
                  size={18}
                  weight={isAIChatMode ? "fill" : "regular"}
                />
                <span>{isAIChatMode ? "Text Editor" : "Agent"}</span>
              </button>
            )}
            <button onClick={() => setConfirmReset(true)} className="write-nav-item">
              <Trash size={18} />
              <span>New draft</span>
            </button>
            <button onClick={toggleTheme} className="write-nav-item">
              {getThemeIcon(theme)}
              <span>Theme</span>
            </button>
            <button onClick={toggleFont} className="write-nav-item">
              <TextAa size={18} />
              <span>
                {font === "serif"
                  ? "Serif"
                  : font === "sans"
                    ? "Sans"
                    : "Monospace"}
              </span>
            </button>
          </div>
        </nav>

        {/* Local storage notice */}
        <div className="write-warning">
          <Warning size={14} />
          <span>Draft stays in this browser. Download a backup before clearing browser data.</span>
        </div>
      </aside>

      {/* Main writing area */}
      <main className="write-main">
        <div className="write-main-header">
          <div className="write-header-left">
            <h1 className="write-main-title">
              {isAIChatMode
                ? "Agent"
                : contentType === "post"
                  ? "Blog Post"
                  : "Page"}
            </h1>
          </div>
          <div className="write-header-actions">
            {!isAIChatMode && <button className="write-copy-btn" onClick={handleDownload}><DownloadSimple size={16} />Download .md</button>}
            <button className="write-copy-btn" onClick={openSettings} aria-expanded={!frontmatterCollapsed} aria-controls="write-frontmatter">{contentType === "post" ? "Post settings" : "Page settings"}</button>
            {!isAIChatMode && (
              <button
                onClick={handleCopy}
                className={`write-copy-btn ${copied ? "copied" : ""}`}
              >
                {copied ? (
                  <>
                    <Check size={16} weight="bold" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <CopySimple size={16} />
                    <span>Copy markdown</span>
                  </>
                )}
              </button>
            )}
            <button
              onClick={toggleFocusMode}
              className={`write-focus-btn ${focusMode ? "active" : ""}`}
              title={focusMode ? "Exit focus mode (Esc)" : "Enter focus mode"}
              aria-label={focusMode ? "Exit focus mode" : "Enter focus mode"}
            >
              {focusMode ? (
                <ArrowsIn size={18} weight="regular" />
              ) : (
                <ArrowsOut size={18} weight="regular" />
              )}
            </button>
          </div>
        </div>

        {/* Conditionally render textarea or AI chat */}
        {isAIChatMode ? (
          <div className="write-ai-chat-container">
            <AIChatView contextId="write-page" />
          </div>
        ) : (
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="write-textarea"
            aria-label="Markdown draft including frontmatter"
            placeholder="Start writing your markdown..."
            spellCheck={true}
            autoComplete="off"
            autoCapitalize="sentences"
            style={{ fontFamily: FONTS[font] }}
          />
        )}

        {/* Footer with stats - only show in text editor mode */}
        {!isAIChatMode && (
          <div className="write-main-footer">
            <div className="write-stats">
              <span>{words} words</span>
              <span className="write-stats-divider" />
              <span>{lines} lines</span>
              <span className="write-stats-divider" />
              <span>{characters} chars</span>
            </div>
            <div className="write-save-hint">
              Download to{" "}
              <code>content/{contentType === "post" ? "blog" : "pages"}/</code>{" "}
              then <code>npm run sync</code>
            </div>
          </div>
        )}
      </main>

      {/* Right Sidebar: Frontmatter fields */}
      <aside
        id="write-frontmatter"
        ref={settingsRef}
        tabIndex={-1}
        aria-label="Frontmatter settings"
        className={`write-sidebar-right ${frontmatterCollapsed ? "collapsed" : ""} ${sidebar.isResizing ? "resizing" : ""}`}
      >
        {!frontmatterCollapsed && (
          <Tip content="Drag to resize. Arrow keys nudge, double-click resets." side="left">
            <div className="dashboard-sidebar-resize-handle" {...sidebar.handleProps} />
          </Tip>
        )}
        <div className="write-sidebar-header">
          <span className="write-sidebar-title">Frontmatter</span>
          <button
            onClick={toggleFrontmatter}
            className="write-sidebar-toggle"
            title={frontmatterCollapsed ? "Expand settings" : "Collapse settings"}
            aria-label={frontmatterCollapsed ? "Expand settings" : "Collapse settings"}
            aria-expanded={!frontmatterCollapsed}
          >
            <SidebarSimple size={16} weight="regular" />
          </button>
        </div>

        <div className="write-fields">
          <p className="write-settings-hint">Edit these fields or the YAML above your markdown. This draft is saved locally; it is not published.</p>
          {parsed.formIssue ? <p role="status">{parsed.formIssue}</p> : (
            <FrontmatterForm
              key={contentType}
              kind={contentType}
              value={parsed.values}
              authorSuggestions={authorSuggestions}
              onChange={(next) => setContent(patchWriteFrontmatter(content, contentType, parsed.values, next))}
              onRequestImage={isAdmin ? (field, initialTab = "upload") => { setImageField(field); setImageTab(initialTab); } : undefined}
            />
          )}
          {!isAdmin && <p className="write-settings-hint"><Link to="/dashboard">Sign in as a dashboard admin</Link> to upload images or choose from the media library. Image URLs work without signing in.</p>}
        </div>
      </aside>
      {isAdmin && imageField && <ImageUploadModal isOpen requiredProvider="r2" initialTab={imageTab} onClose={() => setImageField(null)} onSelectUrl={(url) => {
        setContent(patchWriteFrontmatter(content, contentType, parsed.values, { ...parsed.values, [imageField]: url }));
        setImageField(null);
      }} />}
      {confirmReset && <div className="write-reset-scrim"><section ref={resetDialogRef} className="write-reset-dialog" role="alertdialog" aria-modal="true" aria-labelledby="write-reset-title">
        <h2 id="write-reset-title">Start a new draft?</h2>
        <p>This replaces the draft saved in this browser. Download it first if you want to keep a copy.</p>
        <div className="write-header-actions"><button className="write-copy-btn" onClick={() => setConfirmReset(false)} autoFocus>Keep writing</button><button className="write-copy-btn" onClick={handleDownload}>Download draft</button><button className="write-copy-btn" onClick={handleClear}>Start new draft</button></div>
      </section></div>}
    </div>
    </TooltipProvider>
  );
}
