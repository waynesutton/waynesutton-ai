import "../styles/dashboard-forms.css";
import "../styles/dashboard.css";
import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { Link, Navigate } from "react-router-dom";
import { useQuery, useMutation, useAction } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { useTheme } from "../context/ThemeContext";
import { useFont } from "../context/FontContext";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import TurndownService from "turndown";
import { Marked } from "marked";
import {
  ArrowLeft,
  Article,
  Files,
  Robot,
  Envelope,
  Gear,
  ChartLine,
  ArrowsClockwise,
  CloudArrowDown,
  MagnifyingGlass,
  SignOut,
  Sun,
  Moon,
  TextAa,
  PencilSimple,
  Eye,
  Check,
  X,
  Download,
  Clock,
  Link as LinkIcon,
  Copy,
  Terminal,
  CheckCircle,
  WarningCircle,
  Warning,
  Info,
  Trash,
  File,
  CopySimple,
  House,
  FileText,
  PaperPlaneTilt,
  Users,
  Funnel,
  CaretDoubleLeft,
  CaretLeft,
  CaretRight,
  ClockCounterClockwise,
  TrendUp,
  SidebarSimple,
  Image,
  ChatText,
  SpinnerGap,
  CaretDown,
  ArrowsOut,
  ArrowsIn,
  ArrowSquareOut,
  FloppyDisk,
  Globe,
  Lock,
  Tray,
  Key,
  Broadcast,
  BookOpen,
  XLogo,
  SquaresFour,
  List,
} from "@phosphor-icons/react";
import type { Icon as PhosphorIcon } from "@phosphor-icons/react";
import { useDragSort } from "../hooks/useDragSort";
import { DraftsInbox } from "../components/dashboard/DraftsInbox";
import { ApiKeysSection } from "../components/dashboard/ApiKeysSection";
import { XSection } from "../components/dashboard/XSection";
import AgentReadySection from "../components/AgentReadySection";
import DashboardDocsSection from "../components/DashboardDocsSection";
import siteConfig from "../config/siteConfig";
import type { SiteConfigOverrides } from "../config/runtimeConfig";
import AIChatView from "../components/AIChatView";
import VersionHistoryModal from "../components/VersionHistoryModal";
import { MediaLibrary } from "../components/MediaLibrary";
import { ImageUploadModal } from "../components/ImageUploadModal";
import {
  FrontmatterForm,
  createDefaultFrontmatter,
  parseFrontmatterDocument,
  serializeFrontmatter,
  SLUG_PATTERN,
} from "../components/FrontmatterForm";
import type { FrontmatterImageField, FrontmatterValues } from "../components/FrontmatterForm";

// Default slug values that should trigger a warning
const DEFAULT_SLUGS = ["your-post-url", "page-url"];

// Rows per page choices for the Posts and Pages lists. The first entry is the
// default, and it also decides when the pagination row appears: a list shorter
// than the smallest page size has nothing to page through and nothing to
// configure. Anything longer keeps the row so a list set to 100 per page can be
// set back down again.
const PAGE_SIZE_OPTIONS = [15, 25, 50, 100] as const;
const MIN_PAGE_SIZE = PAGE_SIZE_OPTIONS[0];

// Toast notification types
type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

// Toast notification component
function ToastNotification({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: string) => void;
}) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const getIcon = () => {
    switch (toast.type) {
      case "success":
        return <CheckCircle size={18} weight="fill" />;
      case "error":
        return <Warning size={18} weight="fill" />;
      case "warning":
        return <Warning size={18} weight="fill" />;
      case "info":
      default:
        return <Info size={18} weight="fill" />;
    }
  };

  return (
    <div className={`dashboard-toast ${toast.type}`}>
      <span className="dashboard-toast-icon">{getIcon()}</span>
      <span className="dashboard-toast-message">{toast.message}</span>
      <button className="dashboard-toast-close" onClick={() => onDismiss(toast.id)}>
        <X size={14} />
      </button>
    </div>
  );
}

// Toast container component
function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div className="dashboard-toast-container">
      {toasts.map((toast) => (
        <ToastNotification key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

// Command modal component
interface CommandModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  command: string;
  description?: string;
}

function CommandModal({ isOpen, onClose, title, command, description }: CommandModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyCommand = async () => {
    await navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
    }
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="dashboard-modal-backdrop" onClick={handleBackdropClick}>
      <div className="dashboard-modal">
        <div className="dashboard-modal-header">
          <div className="dashboard-modal-icon">
            <Terminal size={24} weight="regular" />
          </div>
          <h3 className="dashboard-modal-title">{title}</h3>
          <button className="dashboard-modal-close" onClick={onClose}>
            <X size={18} weight="bold" />
          </button>
        </div>

        {description && <p className="dashboard-modal-description">{description}</p>}

        <div className="dashboard-modal-command-container">
          <code className="dashboard-modal-command">{command}</code>
          <button
            className="dashboard-modal-copy-btn"
            onClick={handleCopyCommand}
            title="Copy command">
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </button>
        </div>

        <div className="dashboard-modal-footer">
          <p className="dashboard-modal-hint">Copy this command and run it in your terminal</p>
          <div className="dashboard-modal-actions">
            <button className="dashboard-modal-btn secondary" onClick={onClose}>
              Close
            </button>
            <button className="dashboard-modal-btn primary" onClick={handleCopyCommand}>
              {copied ? "Copied!" : "Copy Command"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Confirm Delete modal component
interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onCopy: () => void;
  title: string;
  itemName: string;
  itemType: "post" | "page";
  isDeleting: boolean;
}

function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  onCopy,
  title,
  itemName,
  itemType,
  isDeleting,
}: ConfirmDeleteModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isDeleting) {
      onClose();
    }
  };

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isDeleting) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
    }
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose, isDeleting]);

  // Reset copied state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setCopied(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="dashboard-modal-backdrop" onClick={handleBackdropClick}>
      <div className="dashboard-modal dashboard-modal-delete">
        <div className="dashboard-modal-header">
          <div className="dashboard-modal-icon dashboard-modal-icon-warning">
            <Warning size={24} weight="fill" />
          </div>
          <h3 className="dashboard-modal-title">{title}</h3>
          <button className="dashboard-modal-close" onClick={onClose} disabled={isDeleting}>
            <X size={18} weight="bold" />
          </button>
        </div>

        <div className="dashboard-modal-content">
          <p className="dashboard-modal-message">
            Are you sure you want to delete this {itemType}?
          </p>
          <div className="dashboard-modal-item-name">
            <FileText size={18} />
            <span>{itemName}</span>
          </div>
          <p className="dashboard-modal-warning-text">
            This action cannot be undone. The {itemType} will be permanently removed from the
            database.
          </p>
          <div className="dashboard-modal-copy-prompt">
            <div className="dashboard-modal-copy-prompt-text">
              <Info size={16} />
              <span>Would you like to copy the markdown before deleting?</span>
            </div>
            <button
              className={`dashboard-modal-copy-btn ${copied ? "copied" : ""}`}
              onClick={handleCopy}
              disabled={isDeleting}
              title="Copy markdown to clipboard">
              {copied ? (
                <>
                  <Check size={16} weight="bold" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <CopySimple size={16} />
                  <span>Copy Markdown</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="dashboard-modal-footer">
          <div className="dashboard-modal-actions">
            <button
              className="dashboard-modal-btn secondary"
              onClick={onClose}
              disabled={isDeleting}>
              Cancel
            </button>
            <button
              className="dashboard-modal-btn danger"
              onClick={onConfirm}
              disabled={isDeleting}>
              {isDeleting ? (
                <>
                  <SpinnerGap size={16} className="animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <Trash size={16} />
                  <span>Delete {itemType}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Sync Warning modal component - warns when saving synced content
interface SyncWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveAnyway: () => void;
  onDownload: () => void;
  onCopy: () => void;
  itemName: string;
  itemType: "post" | "page";
  isSaving: boolean;
}

function SyncWarningModal({
  isOpen,
  onClose,
  onSaveAnyway,
  onDownload,
  onCopy,
  itemName,
  itemType,
  isSaving,
}: SyncWarningModalProps) {
  const [copied, setCopied] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const handleCopy = async () => {
    await onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    onDownload();
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2000);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isSaving) {
      onClose();
    }
  };

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSaving) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
    }
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose, isSaving]);

  // Reset states when modal closes
  useEffect(() => {
    if (!isOpen) {
      setCopied(false);
      setDownloaded(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="dashboard-modal-backdrop" onClick={handleBackdropClick}>
      <div className="dashboard-modal dashboard-modal-sync-warning">
        <div className="dashboard-modal-header">
          <div className="dashboard-modal-icon dashboard-modal-icon-warning">
            <Warning size={24} weight="fill" />
          </div>
          <h3 className="dashboard-modal-title">Synced Content Warning</h3>
          <button className="dashboard-modal-close" onClick={onClose} disabled={isSaving}>
            <X size={18} weight="bold" />
          </button>
        </div>

        <div className="dashboard-modal-content">
          <p className="dashboard-modal-message">
            This {itemType} was synced from a local markdown file.
          </p>
          <div className="dashboard-modal-item-name">
            <FileText size={18} />
            <span>{itemName}</span>
          </div>
          <p className="dashboard-modal-warning-text">
            Changes saved here will be <strong>overwritten</strong> on the next{" "}
            <code>npm run sync</code>. To persist your changes, download or copy the markdown and
            update your local file.
          </p>
          <div className="dashboard-modal-sync-actions">
            <button
              className={`dashboard-modal-action-btn ${downloaded ? "success" : ""}`}
              onClick={handleDownload}
              disabled={isSaving}
              title="Download as .md file">
              {downloaded ? (
                <>
                  <Check size={16} weight="bold" />
                  <span>Downloaded</span>
                </>
              ) : (
                <>
                  <Download size={16} />
                  <span>Download .md</span>
                </>
              )}
            </button>
            <button
              className={`dashboard-modal-action-btn ${copied ? "success" : ""}`}
              onClick={handleCopy}
              disabled={isSaving}
              title="Copy markdown to clipboard">
              {copied ? (
                <>
                  <Check size={16} weight="bold" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <CopySimple size={16} />
                  <span>Copy Markdown</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="dashboard-modal-footer">
          <div className="dashboard-modal-actions">
            <button className="dashboard-modal-btn secondary" onClick={onClose} disabled={isSaving}>
              Cancel
            </button>
            <button
              className="dashboard-modal-btn warning"
              onClick={onSaveAnyway}
              disabled={isSaving}>
              {isSaving ? (
                <>
                  <SpinnerGap size={16} className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <FloppyDisk size={16} />
                  <span>Save Anyway</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Dashboard sections
type DashboardSection =
  | "overview"
  | "posts"
  | "pages"
  | "post-editor"
  | "page-editor"
  | "write-post"
  | "write-page"
  | "ai-agent"
  | "newsletter"
  | "newsletter-send"
  | "newsletter-write-email"
  | "newsletter-recent-sends"
  | "newsletter-stats"
  | "import"
  | "config"
  | "index-html"
  | "stats"
  | "sync"
  | "media"
  | "drafts"
  | "api-keys"
  | "agent-ready"
  | "x"
  | "docs";

// Post/Page type for editing
interface ContentItem {
  _id: string;
  slug: string;
  title: string;
  description?: string;
  content: string;
  date?: string;
  published: boolean;
  tags?: string[];
  featured?: boolean;
  featuredOrder?: number;
  excerpt?: string;
  image?: string;
  ogImage?: string;
  noOgImage?: boolean;
  showImageAtTop?: boolean;
  authorName?: string;
  authorImage?: string;
  order?: number;
  showInNav?: boolean;
  readTime?: string;
  layout?: string;
  rightSidebar?: boolean;
  aiChat?: boolean;
  blogFeatured?: boolean;
  newsletter?: boolean;
  contactForm?: boolean;
  unlisted?: boolean;
  aiWritten?: boolean;
  showFooter?: boolean;
  footer?: string;
  showSocialFooter?: boolean;
  textAlign?: string;
  docsSection?: boolean;
  docsSectionGroup?: string;
  docsSectionOrder?: number;
  docsSectionGroupOrder?: number;
  docsSectionGroupIcon?: string;
  docsLanding?: boolean;
  source?: "dashboard" | "sync" | "demo";
}

// Frontmatter field definition used by generateMarkdown and the
// additional-fields panel in the edit flows
interface FrontmatterFieldDef {
  key: string;
  label: string;
  type: string;
  required: boolean;
  options?: string[];
}

// Frontmatter fields for posts
const postFrontmatterFields: FrontmatterFieldDef[] = [
  // Required fields
  { key: "title", label: "Title", type: "text", required: true },
  { key: "description", label: "Description", type: "textarea", required: true },
  { key: "date", label: "Date", type: "date", required: true },
  { key: "slug", label: "Slug", type: "text", required: true },
  { key: "published", label: "Published", type: "checkbox", required: true },
  { key: "tags", label: "Tags", type: "tags", required: true },
  // Display options
  { key: "featured", label: "Featured", type: "checkbox", required: false },
  { key: "featuredOrder", label: "Featured Order", type: "number", required: false },
  { key: "blogFeatured", label: "Blog Featured", type: "checkbox", required: false },
  { key: "unlisted", label: "Unlisted", type: "checkbox", required: false },
  { key: "aiWritten", label: "Written with AI", type: "checkbox", required: false },
  // Content options
  { key: "excerpt", label: "Excerpt", type: "textarea", required: false },
  { key: "image", label: "Image URL", type: "text", required: false },
  { key: "ogImage", label: "OG Image URL", type: "text", required: false },
  { key: "noOgImage", label: "No OG Image", type: "checkbox", required: false },
  { key: "showImageAtTop", label: "Show Image at Top", type: "checkbox", required: false },
  { key: "readTime", label: "Read Time", type: "text", required: false },
  // Author
  { key: "authorName", label: "Author Name", type: "text", required: false },
  { key: "authorImage", label: "Author Image URL", type: "text", required: false },
  // Layout options
  { key: "layout", label: "Layout", type: "select", options: ["", "sidebar"], required: false },
  { key: "rightSidebar", label: "Right Sidebar", type: "checkbox", required: false },
  { key: "aiChat", label: "AI Chat", type: "checkbox", required: false },
  // Footer options
  { key: "showFooter", label: "Show Footer", type: "checkbox", required: false },
  { key: "footer", label: "Footer Content", type: "textarea", required: false },
  { key: "showSocialFooter", label: "Show Social Footer", type: "checkbox", required: false },
  // Features
  { key: "newsletter", label: "Newsletter", type: "checkbox", required: false },
  { key: "contactForm", label: "Contact Form", type: "checkbox", required: false },
  // Docs section
  { key: "docsSection", label: "Docs Section", type: "checkbox", required: false },
  { key: "docsSectionGroup", label: "Docs Group", type: "text", required: false },
  { key: "docsSectionOrder", label: "Docs Order", type: "number", required: false },
  { key: "docsSectionGroupOrder", label: "Docs Group Order", type: "number", required: false },
  { key: "docsSectionGroupIcon", label: "Docs Group Icon", type: "text", required: false },
  { key: "docsLanding", label: "Docs Landing", type: "checkbox", required: false },
];

// Frontmatter fields for pages
const pageFrontmatterFields: FrontmatterFieldDef[] = [
  // Required fields
  { key: "title", label: "Title", type: "text", required: true },
  { key: "slug", label: "Slug", type: "text", required: true },
  { key: "published", label: "Published", type: "checkbox", required: true },
  // Navigation
  { key: "order", label: "Nav Order", type: "number", required: false },
  { key: "showInNav", label: "Show in Nav", type: "checkbox", required: false },
  // Display options
  { key: "featured", label: "Featured", type: "checkbox", required: false },
  { key: "featuredOrder", label: "Featured Order", type: "number", required: false },
  { key: "unlisted", label: "Unlisted", type: "checkbox", required: false },
  // Content options
  { key: "excerpt", label: "Excerpt", type: "textarea", required: false },
  { key: "image", label: "Image URL", type: "text", required: false },
  { key: "ogImage", label: "OG Image URL", type: "text", required: false },
  { key: "noOgImage", label: "No OG Image", type: "checkbox", required: false },
  { key: "showImageAtTop", label: "Show Image at Top", type: "checkbox", required: false },
  {
    key: "textAlign",
    label: "Text Align",
    type: "select",
    options: ["left", "center", "right"],
    required: false,
  },
  // Author
  { key: "authorName", label: "Author Name", type: "text", required: false },
  { key: "authorImage", label: "Author Image URL", type: "text", required: false },
  // Layout options
  { key: "layout", label: "Layout", type: "select", options: ["", "sidebar"], required: false },
  { key: "rightSidebar", label: "Right Sidebar", type: "checkbox", required: false },
  { key: "aiChat", label: "AI Chat", type: "checkbox", required: false },
  // Footer options
  { key: "showFooter", label: "Show Footer", type: "checkbox", required: false },
  { key: "footer", label: "Footer Content", type: "textarea", required: false },
  { key: "showSocialFooter", label: "Show Social Footer", type: "checkbox", required: false },
  // Features
  { key: "newsletter", label: "Newsletter", type: "checkbox", required: false },
  { key: "contactForm", label: "Contact Form", type: "checkbox", required: false },
  // Docs section
  { key: "docsSection", label: "Docs Section", type: "checkbox", required: false },
  { key: "docsSectionGroup", label: "Docs Group", type: "text", required: false },
  { key: "docsSectionOrder", label: "Docs Order", type: "number", required: false },
  { key: "docsSectionGroupOrder", label: "Docs Group Order", type: "number", required: false },
  { key: "docsSectionGroupIcon", label: "Docs Group Icon", type: "text", required: false },
  { key: "docsLanding", label: "Docs Landing", type: "checkbox", required: false },
];

// Frontmatter keys managed by the FrontmatterForm component. Everything else
// persisted on ContentItem is edited through the additional-fields panel.
const FORM_MANAGED_KEYS: ReadonlySet<string> = new Set([
  "title",
  "description",
  "date",
  "slug",
  "published",
  "tags",
  "featured",
  "featuredOrder",
  "order",
  "showInNav",
  "excerpt",
  "image",
  "ogImage",
  "noOgImage",
  "aiWritten",
  "readTime",
  "authorName",
  "authorImage",
]);

// Map a ContentItem to the FrontmatterForm value object
function itemToFrontmatter(item: ContentItem): FrontmatterValues {
  return {
    title: item.title ?? "",
    slug: item.slug ?? "",
    description: item.description ?? "",
    date: item.date ?? "",
    published: item.published ?? false,
    tags: item.tags ?? [],
    featured: item.featured ?? false,
    featuredOrder: item.featuredOrder,
    order: item.order,
    showInNav: item.showInNav ?? false,
    excerpt: item.excerpt ?? "",
    image: item.image ?? "",
    ogImage: item.ogImage ?? "",
    noOgImage: item.noOgImage ?? false,
    aiWritten: item.aiWritten ?? false,
    readTime: item.readTime ?? "",
    authorName: item.authorName ?? "",
    authorImage: item.authorImage ?? "",
  };
}

// Apply FrontmatterForm values back onto a ContentItem. Empty optional
// strings become undefined so they are omitted from YAML and mutations.
function applyFrontmatterToItem(
  item: ContentItem,
  type: "post" | "page",
  fm: FrontmatterValues
): ContentItem {
  const optionalString = (value: string): string | undefined =>
    value.trim() === "" ? undefined : value;

  const next: ContentItem = {
    ...item,
    title: fm.title,
    slug: fm.slug,
    published: fm.published,
    featured: fm.featured,
    featuredOrder: fm.featuredOrder,
    excerpt: optionalString(fm.excerpt),
    image: optionalString(fm.image),
    ogImage: optionalString(fm.ogImage),
    noOgImage: fm.noOgImage ? true : undefined,
    authorName: optionalString(fm.authorName),
    authorImage: optionalString(fm.authorImage),
  };

  if (type === "post") {
    next.description = fm.description;
    next.date = optionalString(fm.date);
    next.tags = fm.tags;
    next.readTime = optionalString(fm.readTime);
    next.aiWritten = fm.aiWritten;
  } else {
    next.order = fm.order;
    next.showInNav = fm.showInNav;
  }

  return next;
}

// Convex drops undefined values inside nested mutation arguments, so a field the
// editor emptied has to be named for the mutation to delete it. Only fields that
// posts.listAll and pages.listAll return are listed, so a save never wipes a
// field the editor never loaded.
const CLEARABLE_POST_FIELDS = [
  "image",
  "ogImage",
  "noOgImage",
  "excerpt",
  "readTime",
  "featuredOrder",
  "authorName",
  "authorImage",
] as const;

const CLEARABLE_PAGE_FIELDS = [
  "image",
  "ogImage",
  "noOgImage",
  "excerpt",
  "order",
  "featuredOrder",
  "authorName",
  "authorImage",
] as const;

// Demo mutations accept a smaller field set
const CLEARABLE_DEMO_POST_FIELDS = ["image", "excerpt", "readTime", "authorName"] as const;
const CLEARABLE_DEMO_PAGE_FIELDS = ["image", "excerpt", "authorName"] as const;

function clearedFields<Field extends keyof ContentItem>(
  item: ContentItem,
  fields: readonly Field[]
): Array<Field> {
  return fields.filter((field) => item[field] === undefined);
}

// Loading state component for auth
function LoadingState() {
  return (
    <div className="dashboard-auth-container">
      <p>Loading authentication...</p>
    </div>
  );
}

// Dashboard disabled message
function DashboardDisabled() {
  return (
    <div className="dashboard-auth-container">
      <div className="dashboard-auth-card">
        <h1>Dashboard Disabled</h1>
        <p>The dashboard is currently disabled in site configuration.</p>
        <p
          style={{
            marginTop: "1rem",
            fontSize: "0.875rem",
            color: "var(--text-secondary)",
          }}>
          To enable the dashboard, set <code>dashboard.enabled: true</code> in{" "}
          <code>siteConfig.ts</code>.
        </p>
        <p style={{ marginTop: "1.5rem" }}>
          <Link to="/">Back to Home</Link>
        </p>
      </div>
    </div>
  );
}

// Marks that the browser left for GitHub. A failed OAuth callback returns to
// /dashboard with no code, so a marker that survives the round trip means the
// previous attempt never completed.
const SIGN_IN_PENDING_KEY = "dashboard-github-signin-pending";

type SignInAction = ReturnType<typeof useAuthActions>["signIn"];

// Convex Auth's signIn navigates the browser to the OAuth redirect itself.
// Navigating again here would send a second request to /api/auth/signin/github
// with the same verifier, and each request overwrites that verifier's PKCE
// signature, so the callback can fail with "Invalid state" and bounce back
// unauthenticated.
async function startGithubSignIn(signIn: SignInAction): Promise<void> {
  sessionStorage.setItem(SIGN_IN_PENDING_KEY, Date.now().toString());
  try {
    await signIn("github", { redirectTo: "/dashboard" });
  } catch (error) {
    sessionStorage.removeItem(SIGN_IN_PENDING_KEY);
    throw error;
  }
}

function LoginPrompt({ signInFailed = false }: { signInFailed?: boolean }) {
  const { signIn } = useAuthActions();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleGithubSignIn = async () => {
    setIsSubmitting(true);
    try {
      await startGithubSignIn(signIn);
    } catch {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="dashboard-auth-container">
      <div className="dashboard-auth-card">
        <h1>WayneSutton.ai Dashboard</h1>
        <p>Restricted access to WayneSutton.ai team members only.</p>
        {signInFailed && !isSubmitting && (
          <p className="dashboard-auth-notice" role="status">
            That sign-in did not complete. Try again.
          </p>
        )}
        <button
          onClick={() => {
            void handleGithubSignIn();
          }}
          className="dashboard-sign-in-button"
          disabled={isSubmitting}>
          {isSubmitting ? "Redirecting..." : "Sign in with GitHub"}
        </button>
        <p style={{ marginTop: "1rem" }}>
          <Link to="/">Back to Home</Link>
        </p>
      </div>
    </div>
  );
}

// Compact sign-in button for the demo sidebar footer
// Read-only gate shown for admin-only sections in demo mode
function DemoSectionGate({ section }: { section: string }) {
  return (
    <div className="demo-section-gate">
      <Lock size={32} weight="bold" />
      <h3>{section}</h3>
      <p>Sign in with GitHub for full access to {section.toLowerCase()}.</p>
      <p className="demo-gate-hint">This feature requires an authenticated admin session.</p>
    </div>
  );
}

function DemoSignInButton() {
  const { signIn } = useAuthActions();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleGithubSignIn = async () => {
    setIsSubmitting(true);
    try {
      await startGithubSignIn(signIn);
    } catch {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="dashboard-user-card">
        <Globe size={20} weight="bold" />
        <div className="dashboard-user-info">
          <span className="dashboard-user-name">Demo Mode</span>
        </div>
      </div>
      <button
        className="dashboard-signout-btn"
        onClick={() => {
          void handleGithubSignIn();
        }}
        title="Sign in with GitHub for full access"
        disabled={isSubmitting}>
        <span>{isSubmitting ? "Redirecting..." : "Sign in with GitHub"}</span>
      </button>
    </>
  );
}

// Sidebar nav section with drag-and-drop item ordering.
// Items reorder within their section; the last sort persists per browser
// under dashboard-nav-order:<section label> in localStorage.
function SortableNavSection({
  label,
  items,
  activeSection,
  onSelect,
}: {
  label: string;
  items: Array<{ id: DashboardSection; label: string; icon: PhosphorIcon }>;
  activeSection: DashboardSection;
  onSelect: (id: DashboardSection) => void;
}) {
  const drag = useDragSort(
    `dashboard-nav-order:${label}`,
    items.map((item) => item.id)
  );
  const itemsById = new Map<string, (typeof items)[number]>(items.map((item) => [item.id, item]));

  return (
    <div className="dashboard-nav-section">
      <span className="dashboard-nav-label">{label}</span>
      {drag.sortedIds.map((id) => {
        const item = itemsById.get(id);
        if (!item) {
          return null;
        }
        return (
          <button
            key={item.id}
            draggable
            onDragStart={drag.onDragStart(item.id)}
            onDragOver={drag.onDragOver(item.id)}
            onDrop={drag.onDrop}
            onDragEnd={drag.onDragEnd}
            className={`dashboard-nav-item ${activeSection === item.id ? "active" : ""} ${
              drag.draggingId === item.id ? "dragging" : ""
            }`}
            title="Click to open, drag to reorder"
            onClick={() => onSelect(item.id)}>
            <item.icon size={18} weight={activeSection === item.id ? "fill" : "regular"} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// Blocks users who completed OAuth but are not in the admin allowlist.
// Keep sign-out visible so admins can recover from an email mismatch.
function DeniedAccessDemo() {
  const authDebug = useQuery(api.authAdmin.getCurrentDashboardAuthDebug);
  const { signOut } = useAuthActions();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);
    try {
      await signOut();
      window.location.assign("/dashboard");
    } finally {
      setIsSigningOut(false);
    }
  };

  const signedInEmail = authDebug?.authUserEmail ?? authDebug?.identityEmail ?? "unknown email";
  const adminGate = authDebug?.strictAdminEmail
    ? "the configured strict admin email"
    : "one of the configured dashboard admin emails";

  return (
    <div className="dashboard-auth-container">
      <div className="dashboard-auth-card" role="status">
        <strong>Signed in, but not a dashboard admin.</strong>
        <p style={{ marginTop: "0.75rem" }}>
          GitHub email: {signedInEmail}. Expected {adminGate}.
        </p>
        <button
          type="button"
          className="dashboard-signout-btn"
          onClick={() => {
            void handleSignOut();
          }}
          disabled={isSigningOut}>
          <SignOut size={18} />
          <span>{isSigningOut ? "Signing out..." : "Sign out and retry"}</span>
        </button>
      </div>
    </div>
  );
}

function FirstAdminSetupRequired() {
  return (
    <div className="dashboard-auth-container">
      <div className="dashboard-auth-card">
        <h1>Dashboard admin setup required</h1>
        <p>
          You are signed in, but no dashboard admin exists yet. Bootstrap the first admin from your
          terminal.
        </p>
        <p style={{ marginTop: "0.75rem", textAlign: "left", color: "var(--text-secondary)" }}>
          1. Set a bootstrap key in Convex env:
          <br />
          <code>
            npx convex env set DASHBOARD_ADMIN_BOOTSTRAP_KEY &quot;&lt;random-key&gt;&quot;
          </code>
          <br />
          2. Run bootstrap:
          <br />
          <code>npx convex run authAdmin:bootstrapDashboardAdmin</code>
        </p>
        <p style={{ marginTop: "1rem" }}>
          <Link to="/">Back to Home</Link>
        </p>
      </div>
    </div>
  );
}

// Main Dashboard export with conditional auth wrapper
export default function Dashboard() {
  // Check if dashboard is enabled in siteConfig
  const dashboardEnabled = siteConfig.dashboard?.enabled ?? true;
  const requireAuth = siteConfig.dashboard?.requireAuth ?? true;
  const authMode = siteConfig.auth?.mode ?? "convex-auth";
  const isDashboardAdmin = useQuery(api.authAdmin.isCurrentUserDashboardAdmin);
  const isAuthenticated = useQuery(api.authAdmin.isCurrentUserAuthenticated);
  const authSetupStatus = useQuery(api.authAdmin.getAuthSetupStatus);
  const [signInFailed, setSignInFailed] = useState(false);

  // Consume the pending marker once auth settles. Still unauthenticated means
  // the OAuth callback returned without a code, so tell the user to retry
  // instead of showing a bare sign-in screen.
  useEffect(() => {
    if (isAuthenticated === undefined) return;
    if (sessionStorage.getItem(SIGN_IN_PENDING_KEY) === null) return;
    sessionStorage.removeItem(SIGN_IN_PENDING_KEY);
    if (!isAuthenticated) {
      setSignInFailed(true);
    }
  }, [isAuthenticated]);

  // If dashboard is disabled, show disabled message
  if (!dashboardEnabled) {
    return <DashboardDisabled />;
  }

  // Optional local mode without auth
  if (!requireAuth) {
    return <DashboardContent />;
  }

  // Convex auth mode: show login prompt or demo mode for unauthenticated users.
  if (authMode === "convex-auth") {
    if (
      isAuthenticated === undefined ||
      isDashboardAdmin === undefined ||
      authSetupStatus === undefined
    ) {
      return <LoadingState />;
    }
    if (!isAuthenticated) {
      return <LoginPrompt signInFailed={signInFailed} />;
    }
    if (!isDashboardAdmin) {
      // Bootstrap path remains for forks without DASHBOARD_PRIMARY_ADMIN_EMAIL set.
      // Once strict email mode is configured, that env var is the sole admin gate.
      if (!authSetupStatus.strictAdminEmailConfigured && authSetupStatus.adminCount === 0) {
        return <FirstAdminSetupRequired />;
      }
      // App-level denied session: block dashboard and offer sign-out.
      return <DeniedAccessDemo />;
    }
    return <DashboardContent />;
  }

  // No-auth mode still enforces server-side admin checks when requireAuth is true.
  if (isDashboardAdmin === undefined) {
    return <LoadingState />;
  }
  if (!isDashboardAdmin) {
    return <Navigate to="/?dashboardNotice=not-admin" replace />;
  }

  return <DashboardContent />;
}

// Dashboard content (protected by auth wrapper above)
function DashboardContent({ isDemo = false }: { isDemo?: boolean } = {}) {
  const { theme, setTheme } = useTheme();
  const { fontFamily, setFontFamily, fontScale, setFontScale } = useFont();
  const { signOut } = useAuthActions();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [activeSection, setActiveSection] = useState<DashboardSection>("overview");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null);
  const [editingType, setEditingType] = useState<"post" | "page">("post");
  const [showPreview, setShowPreview] = useState(false);

  // Sidebar collapsed state (persisted to localStorage)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem("dashboard-sidebar-collapsed");
    return saved === "true";
  });

  // Toggle sidebar collapsed state
  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => {
      const newValue = !prev;
      localStorage.setItem("dashboard-sidebar-collapsed", String(newValue));
      return newValue;
    });
  }, []);

  // Keyboard shortcut: Cmd+. to toggle sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === ".") {
        e.preventDefault();
        toggleSidebar();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [toggleSidebar]);

  // Toast notifications state
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Command modal state
  const [commandModal, setCommandModal] = useState<{
    isOpen: boolean;
    title: string;
    command: string;
    description?: string;
  }>({ isOpen: false, title: "", command: "" });

  // Delete confirmation modal state
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    id: string;
    title: string;
    type: "post" | "page";
    item: ContentItem | null;
  }>({ isOpen: false, id: "", title: "", type: "post", item: null });
  const [isDeleting, setIsDeleting] = useState(false);

  // Sync warning modal state (for saving synced content)
  const [syncWarningModal, setSyncWarningModal] = useState<{
    isOpen: boolean;
    item: ContentItem | null;
    type: "post" | "page";
  }>({ isOpen: false, item: null, type: "post" });
  const [isSavingWithWarning, setIsSavingWithWarning] = useState(false);

  // Sync server state
  const [syncOutput, setSyncOutput] = useState<string>("");
  const [syncRunning, setSyncRunning] = useState<string | null>(null); // command id or null
  const [syncServerAvailable, setSyncServerAvailable] = useState<boolean | null>(null);
  const syncOutputRef = useRef<HTMLPreElement>(null);

  // Convex queries: use auth-free demo queries when in demo mode
  const adminPosts = useQuery(api.posts.listAll, isDemo ? "skip" : {});
  const adminPages = useQuery(api.pages.listAll, isDemo ? "skip" : {});
  const demoPosts = useQuery(api.demo.listAllPosts, isDemo ? {} : "skip");
  const demoPages = useQuery(api.demo.listAllPages, isDemo ? {} : "skip");
  const posts: typeof adminPosts = isDemo ? demoPosts : adminPosts;
  const pages: typeof adminPages = isDemo ? demoPages : adminPages;

  // CMS mutations for CRUD operations (admin)
  const deletePostMutation = useMutation(api.cms.deletePost);
  const deletePageMutation = useMutation(api.cms.deletePage);
  const updatePostMutation = useMutation(api.cms.updatePost);
  const updatePageMutation = useMutation(api.cms.updatePage);

  // Demo mutations (no auth required, only operates on source="demo" content)
  const demoDeletePostMutation = useMutation(api.demo.deleteDemoPost);
  const demoDeletePageMutation = useMutation(api.demo.deleteDemoPage);
  const demoUpdatePostMutation = useMutation(api.demo.updateDemoPost);
  const demoUpdatePageMutation = useMutation(api.demo.updateDemoPage);

  // Add toast notification
  const addToast = useCallback((message: string, type: ToastType = "info") => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  // Dismiss toast notification
  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Handle the X OAuth callback landing (?x=connected|denied|error), then
  // clean the param so refreshes do not repeat the toast
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const xResult = params.get("x");
    if (!xResult) return;
    if (xResult === "connected") {
      setActiveSection("x");
      addToast("X account connected", "success");
    } else if (xResult === "denied") {
      addToast("X connect was cancelled", "info");
    } else {
      addToast("X connect failed. Check X_CLIENT_ID and X_CLIENT_SECRET.", "error");
    }
    params.delete("x");
    const rest = params.toString();
    window.history.replaceState(
      {},
      "",
      `${window.location.pathname}${rest ? `?${rest}` : ""}`,
    );
  }, [addToast]);

  // Check if sync server is available on mount
  // Skip check entirely in development to avoid console noise
  useEffect(() => {
    // Only check sync server if explicitly enabled via env var
    const syncServerEnabled = import.meta.env.VITE_SYNC_SERVER_ENABLED === "true";
    if (!syncServerEnabled) {
      setSyncServerAvailable(false);
      return;
    }

    const checkServer = async () => {
      try {
        const res = await fetch("http://127.0.0.1:3001/health", {
          method: "GET",
          signal: AbortSignal.timeout(2000),
        });
        if (res.ok) {
          setSyncServerAvailable(true);
        } else {
          setSyncServerAvailable(false);
        }
      } catch {
        setSyncServerAvailable(false);
      }
    };
    checkServer();
  }, []);

  // Execute sync command via sync server
  const executeSync = useCallback(
    async (commandId: string, commandLabel: string) => {
      // Check server availability first
      if (syncServerAvailable === false) {
        addToast("Sync server not running. Start it with: npm run sync-server", "error");
        return;
      }

      if (syncRunning) {
        addToast("A sync command is already running", "warning");
        return;
      }

      setSyncRunning(commandId);
      setSyncOutput("");

      try {
        const token = localStorage.getItem("syncToken") || "";
        const response = await fetch("http://127.0.0.1:3001/api/sync", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Sync-Token": token,
          },
          body: JSON.stringify({ command: commandId }),
        });

        if (!response.ok) {
          const error = await response.json();
          addToast(error.error || "Failed to execute sync", "error");
          setSyncRunning(null);
          return;
        }

        // Stream the response
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          addToast("Failed to read sync output", "error");
          setSyncRunning(null);
          return;
        }

        addToast(`Running: ${commandLabel}`, "info");

        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;

          const text = decoder.decode(value, { stream: true });
          setSyncOutput((prev) => prev + text);

          // Auto-scroll to bottom
          if (syncOutputRef.current) {
            syncOutputRef.current.scrollTop = syncOutputRef.current.scrollHeight;
          }
        }

        addToast(`Completed: ${commandLabel}`, "success");
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        if (message.includes("Failed to fetch") || message.includes("NetworkError")) {
          addToast("Sync server not running. Start it with: npm run sync-server", "error");
          setSyncServerAvailable(false);
        } else {
          addToast(`Sync failed: ${message}`, "error");
        }
      } finally {
        setSyncRunning(null);
      }
    },
    [syncRunning, syncServerAvailable, addToast]
  );

  // Show command modal
  const showCommandModal = useCallback((title: string, command: string, description?: string) => {
    setCommandModal({ isOpen: true, title, command, description });
  }, []);

  // Close command modal
  const closeCommandModal = useCallback(() => {
    setCommandModal({ isOpen: false, title: "", command: "" });
  }, []);

  // Filter posts/pages based on search
  const filteredPosts = useMemo(() => {
    if (!posts) return [];
    if (!searchQuery) return posts;
    const query = searchQuery.toLowerCase();
    return posts.filter(
      (post) =>
        post.title.toLowerCase().includes(query) ||
        post.slug.toLowerCase().includes(query) ||
        post.description?.toLowerCase().includes(query)
    );
  }, [posts, searchQuery]);

  const filteredPages = useMemo(() => {
    if (!pages) return [];
    if (!searchQuery) return pages;
    const query = searchQuery.toLowerCase();
    return pages.filter(
      (page) => page.title.toLowerCase().includes(query) || page.slug.toLowerCase().includes(query)
    );
  }, [pages, searchQuery]);

  // Handle editing a post
  const handleEditPost = useCallback((post: ContentItem) => {
    setEditingItem(post);
    setEditingType("post");
    setActiveSection("post-editor");
  }, []);

  // Open a post created from a draft (Drafts Inbox) in the post editor
  const handleOpenPostBySlug = useCallback(
    (slug: string) => {
      const post = posts?.find((p) => p.slug === slug);
      if (!post) {
        addToast(`Post /${slug} was not found`, "error");
        return;
      }
      handleEditPost(post);
    },
    [posts, handleEditPost, addToast],
  );

  // Handle editing a page
  const handleEditPage = useCallback((page: ContentItem) => {
    setEditingItem(page);
    setEditingType("page");
    setActiveSection("page-editor");
  }, []);

  // Show delete confirmation modal for a post
  const handleDeletePost = useCallback((item: ContentItem) => {
    setDeleteModal({
      isOpen: true,
      id: item._id,
      title: item.title,
      type: "post",
      item,
    });
  }, []);

  // Show delete confirmation modal for a page
  const handleDeletePage = useCallback((item: ContentItem) => {
    setDeleteModal({
      isOpen: true,
      id: item._id,
      title: item.title,
      type: "page",
      item,
    });
  }, []);

  // Close delete modal
  const closeDeleteModal = useCallback(() => {
    if (!isDeleting) {
      setDeleteModal({ isOpen: false, id: "", title: "", type: "post", item: null });
    }
  }, [isDeleting]);

  // Confirm and execute deletion
  const confirmDelete = useCallback(async () => {
    setIsDeleting(true);
    try {
      if (deleteModal.type === "post") {
        if (isDemo) {
          await demoDeletePostMutation({ id: deleteModal.id as Id<"posts"> });
        } else {
          await deletePostMutation({ id: deleteModal.id as Id<"posts"> });
        }
        addToast("Post deleted successfully", "success");
      } else {
        if (isDemo) {
          await demoDeletePageMutation({ id: deleteModal.id as Id<"pages"> });
        } else {
          await deletePageMutation({ id: deleteModal.id as Id<"pages"> });
        }
        addToast("Page deleted successfully", "success");
      }
      setDeleteModal({ isOpen: false, id: "", title: "", type: "post", item: null });
    } catch (error) {
      addToast(
        error instanceof Error ? error.message : `Failed to delete ${deleteModal.type}`,
        "error"
      );
    } finally {
      setIsDeleting(false);
    }
  }, [
    deleteModal,
    deletePostMutation,
    deletePageMutation,
    demoDeletePostMutation,
    demoDeletePageMutation,
    isDemo,
    addToast,
  ]);

  // Internal function to save post (called after warning or directly for dashboard content)
  const doSavePost = useCallback(
    async (item: ContentItem) => {
      try {
        if (isDemo) {
          await demoUpdatePostMutation({
            id: item._id as Id<"posts">,
            post: {
              title: item.title,
              description: item.description,
              content: item.content,
              date: item.date,
              published: item.published,
              tags: item.tags,
              excerpt: item.excerpt,
              image: item.image,
              readTime: item.readTime,
              authorName: item.authorName,
            },
            clearFields: clearedFields(item, CLEARABLE_DEMO_POST_FIELDS),
          });
        } else {
          await updatePostMutation({
            id: item._id as Id<"posts">,
            post: {
              title: item.title,
              description: item.description,
              content: item.content,
              date: item.date,
              published: item.published,
              tags: item.tags,
              excerpt: item.excerpt,
              image: item.image,
              ogImage: item.ogImage,
              noOgImage: item.noOgImage,
              showImageAtTop: item.showImageAtTop,
              readTime: item.readTime,
              featured: item.featured,
              featuredOrder: item.featuredOrder,
              blogFeatured: item.blogFeatured,
              unlisted: item.unlisted,
              aiWritten: item.aiWritten,
              authorName: item.authorName,
              authorImage: item.authorImage,
              layout: item.layout,
              rightSidebar: item.rightSidebar,
              aiChat: item.aiChat,
              showFooter: item.showFooter,
              footer: item.footer,
              showSocialFooter: item.showSocialFooter,
              newsletter: item.newsletter,
              contactForm: item.contactForm,
              docsSection: item.docsSection,
              docsSectionGroup: item.docsSectionGroup,
              docsSectionOrder: item.docsSectionOrder,
              docsSectionGroupOrder: item.docsSectionGroupOrder,
              docsSectionGroupIcon: item.docsSectionGroupIcon,
              docsLanding: item.docsLanding,
            },
            clearFields: clearedFields(item, CLEARABLE_POST_FIELDS),
          });
        }
        addToast("Post saved successfully", "success");
      } catch (error) {
        addToast(error instanceof Error ? error.message : "Failed to save post", "error");
      }
    },
    [updatePostMutation, demoUpdatePostMutation, isDemo, addToast]
  );

  // Internal function to save page (called after warning or directly for dashboard content)
  const doSavePage = useCallback(
    async (item: ContentItem) => {
      try {
        if (isDemo) {
          await demoUpdatePageMutation({
            id: item._id as Id<"pages">,
            page: {
              title: item.title,
              content: item.content,
              published: item.published,
              excerpt: item.excerpt,
              image: item.image,
              authorName: item.authorName,
            },
            clearFields: clearedFields(item, CLEARABLE_DEMO_PAGE_FIELDS),
          });
        } else {
          await updatePageMutation({
            id: item._id as Id<"pages">,
            page: {
              title: item.title,
              content: item.content,
              published: item.published,
              order: item.order,
              showInNav: item.showInNav,
              excerpt: item.excerpt,
              image: item.image,
              ogImage: item.ogImage,
              noOgImage: item.noOgImage,
              showImageAtTop: item.showImageAtTop,
              featured: item.featured,
              featuredOrder: item.featuredOrder,
              unlisted: item.unlisted,
              authorName: item.authorName,
              authorImage: item.authorImage,
              layout: item.layout,
              rightSidebar: item.rightSidebar,
              aiChat: item.aiChat,
              showFooter: item.showFooter,
              footer: item.footer,
              showSocialFooter: item.showSocialFooter,
              newsletter: item.newsletter,
              contactForm: item.contactForm,
              textAlign: item.textAlign,
              docsSection: item.docsSection,
              docsSectionGroup: item.docsSectionGroup,
              docsSectionOrder: item.docsSectionOrder,
              docsSectionGroupOrder: item.docsSectionGroupOrder,
              docsSectionGroupIcon: item.docsSectionGroupIcon,
              docsLanding: item.docsLanding,
            },
            clearFields: clearedFields(item, CLEARABLE_PAGE_FIELDS),
          });
        }
        addToast("Page saved successfully", "success");
      } catch (error) {
        addToast(error instanceof Error ? error.message : "Failed to save page", "error");
      }
    },
    [updatePageMutation, demoUpdatePageMutation, isDemo, addToast]
  );

  // Handle saving post - shows warning if synced content
  const handleSavePost = useCallback(
    async (item: ContentItem) => {
      // Check if this is synced content (not created in dashboard)
      if (item.source === "sync" || !item.source) {
        // Show warning modal
        setSyncWarningModal({ isOpen: true, item, type: "post" });
      } else {
        // Dashboard-created content, save directly
        await doSavePost(item);
      }
    },
    [doSavePost]
  );

  // Handle saving page - shows warning if synced content
  const handleSavePage = useCallback(
    async (item: ContentItem) => {
      // Check if this is synced content (not created in dashboard)
      if (item.source === "sync" || !item.source) {
        // Show warning modal
        setSyncWarningModal({ isOpen: true, item, type: "page" });
      } else {
        // Dashboard-created content, save directly
        await doSavePage(item);
      }
    },
    [doSavePage]
  );

  // Close sync warning modal
  const closeSyncWarningModal = useCallback(() => {
    if (!isSavingWithWarning) {
      setSyncWarningModal({ isOpen: false, item: null, type: "post" });
    }
  }, [isSavingWithWarning]);

  // Handle "Save Anyway" from sync warning modal
  const handleSaveAnywayFromModal = useCallback(async () => {
    if (!syncWarningModal.item) return;

    setIsSavingWithWarning(true);
    try {
      if (syncWarningModal.type === "post") {
        await doSavePost(syncWarningModal.item);
      } else {
        await doSavePage(syncWarningModal.item);
      }
      setSyncWarningModal({ isOpen: false, item: null, type: "post" });
    } finally {
      setIsSavingWithWarning(false);
    }
  }, [syncWarningModal, doSavePost, doSavePage]);

  // Generate markdown content from item
  const generateMarkdown = useCallback((item: ContentItem, type: "post" | "page"): string => {
    const fields = type === "post" ? postFrontmatterFields : pageFrontmatterFields;
    let frontmatter = "---\n";

    fields.forEach((field) => {
      const value = item[field.key as keyof ContentItem];
      if (value !== undefined && value !== null && value !== "") {
        if (field.type === "tags" && Array.isArray(value)) {
          frontmatter += `${field.key}: [${value.map((t) => `"${t}"`).join(", ")}]\n`;
        } else if (field.type === "checkbox") {
          frontmatter += `${field.key}: ${value}\n`;
        } else if (field.type === "number") {
          frontmatter += `${field.key}: ${value}\n`;
        } else {
          frontmatter += `${field.key}: "${String(value).replace(/"/g, '\\"')}"\n`;
        }
      }
    });

    frontmatter += "---\n\n";
    return frontmatter + item.content;
  }, []);

  // Copy markdown content before deletion
  const handleCopyBeforeDelete = useCallback(async () => {
    if (!deleteModal.item) return;
    const markdown = generateMarkdown(deleteModal.item, deleteModal.type);
    await navigator.clipboard.writeText(markdown);
    addToast("Markdown copied to clipboard", "success");
  }, [deleteModal, generateMarkdown, addToast]);

  // Download markdown file
  const handleDownloadMarkdown = useCallback(() => {
    if (!editingItem) return;

    const markdown = generateMarkdown(editingItem, editingType);
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${editingItem.slug}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addToast(`Downloaded ${editingItem.slug}.md`, "success");
  }, [editingItem, editingType, generateMarkdown, addToast]);

  // Copy markdown to clipboard
  const handleCopyMarkdown = useCallback(async () => {
    if (!editingItem) return;

    const markdown = generateMarkdown(editingItem, editingType);
    await navigator.clipboard.writeText(markdown);
    addToast("Markdown copied to clipboard", "success");
  }, [editingItem, editingType, generateMarkdown, addToast]);

  // Generate markdown for sync warning modal download/copy
  const handleSyncWarningDownload = useCallback(() => {
    if (!syncWarningModal.item) return;

    const markdown = generateMarkdown(syncWarningModal.item, syncWarningModal.type);
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${syncWarningModal.item.slug}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addToast(`Downloaded ${syncWarningModal.item.slug}.md`, "success");
  }, [syncWarningModal, generateMarkdown, addToast]);

  const handleSyncWarningCopy = useCallback(async () => {
    if (!syncWarningModal.item) return;

    const markdown = generateMarkdown(syncWarningModal.item, syncWarningModal.type);
    await navigator.clipboard.writeText(markdown);
    addToast("Markdown copied to clipboard", "success");
  }, [syncWarningModal, generateMarkdown, addToast]);

  // Navigation items for left sidebar
  // Filter items based on feature configuration
  const mediaEnabled = siteConfig.media?.enabled ?? false;
  const newsletterEnabled = siteConfig.newsletter?.enabled ?? false;

  // All sections visible in both admin and demo mode (demo gates interactivity, not visibility)
  const navSections = [
    {
      label: "Content",
      items: [
        { id: "overview" as const, label: "Overview", icon: SquaresFour },
        { id: "posts" as const, label: "Posts", icon: Article },
        { id: "pages" as const, label: "Pages", icon: Files },
      ],
    },
    {
      label: "Create",
      items: [
        { id: "write-post" as const, label: "Write Post", icon: Article },
        { id: "write-page" as const, label: "Write Page", icon: File },
        { id: "drafts" as const, label: "Drafts Inbox", icon: Tray },
        { id: "ai-agent" as const, label: "AI Agent", icon: Robot },
        { id: "import" as const, label: "Import URL", icon: CloudArrowDown },
        ...(mediaEnabled ? [{ id: "media" as const, label: "Media", icon: Image }] : []),
      ],
    },
    ...(newsletterEnabled
      ? [
          {
            label: "Newsletter",
            items: [
              {
                id: "newsletter" as const,
                label: "Subscribers",
                icon: Envelope,
              },
              {
                id: "newsletter-send" as const,
                label: "Send Newsletter",
                icon: Envelope,
              },
              {
                id: "newsletter-write-email" as const,
                label: "Write Email",
                icon: PencilSimple,
              },
              {
                id: "newsletter-recent-sends" as const,
                label: "Recent Sends",
                icon: ClockCounterClockwise,
              },
              {
                id: "newsletter-stats" as const,
                label: "Email Stats",
                icon: ChartLine,
              },
            ],
          },
        ]
      : []),
    {
      label: "Settings",
      items: [
        { id: "api-keys" as const, label: "API Keys", icon: Key },
        { id: "config" as const, label: "Site Config", icon: Gear },
        { id: "agent-ready" as const, label: "Agent Ready", icon: Broadcast },
        { id: "x" as const, label: "X", icon: XLogo },
        { id: "index-html" as const, label: "Index HTML", icon: FileText },
        { id: "stats" as const, label: "Analytics", icon: ChartLine },
        { id: "sync" as const, label: "Sync Content", icon: ArrowsClockwise },
      ],
    },
    {
      label: "Help",
      items: [{ id: "docs" as const, label: "Docs", icon: BookOpen }],
    },
  ];

  // Theme toggle
  const toggleTheme = () => {
    const themes: Array<"dark" | "light" | "tan" | "cloud"> = ["dark", "light", "tan", "cloud"];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  // Font toggle
  const toggleFont = () => {
    const fonts: Array<"serif" | "sans" | "monospace"> = ["serif", "sans", "monospace"];
    const currentIndex = fonts.indexOf(fontFamily);
    const nextIndex = (currentIndex + 1) % fonts.length;
    setFontFamily(fonts[nextIndex]);
  };

  // Font size cycle: small -> default -> large -> xlarge
  const toggleFontScale = () => {
    const scales: Array<"small" | "default" | "large" | "xlarge"> = [
      "small",
      "default",
      "large",
      "xlarge",
    ];
    const currentIndex = scales.indexOf(fontScale);
    setFontScale(scales[(currentIndex + 1) % scales.length]);
  };

  const fontScaleLabel = { small: "S", default: "M", large: "L", xlarge: "XL" }[fontScale];

  const handleDashboardSignOut = useCallback(async () => {
    if (isSigningOut) {
      return;
    }
    setIsSigningOut(true);
    try {
      await signOut();
      window.location.assign("/dashboard");
    } finally {
      setIsSigningOut(false);
    }
  }, [isSigningOut, signOut]);

  // Check if auth is disabled (for warning banner)
  const requireAuth = siteConfig.dashboard?.requireAuth ?? false;
  const showAuthWarning = !requireAuth;

  return (
    <div className={`dashboard-layout ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Auth Warning Banner - shown when authentication is not enabled */}
      {showAuthWarning && (
        <div className="dashboard-auth-warning">
          <Warning size={16} weight="bold" />
          <span>
            Dashboard access is open. Keep dashboard.requireAuth: true in siteConfig.ts for secure
            access.
          </span>
        </div>
      )}

      {/* Command Modal */}
      <CommandModal
        isOpen={commandModal.isOpen}
        onClose={closeCommandModal}
        title={commandModal.title}
        command={commandModal.command}
        description={commandModal.description}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        onConfirm={confirmDelete}
        onCopy={handleCopyBeforeDelete}
        title="Delete Confirmation"
        itemName={deleteModal.title}
        itemType={deleteModal.type}
        isDeleting={isDeleting}
      />

      {/* Sync Warning Modal - warns when saving synced content */}
      <SyncWarningModal
        isOpen={syncWarningModal.isOpen}
        onClose={closeSyncWarningModal}
        onSaveAnyway={handleSaveAnywayFromModal}
        onDownload={handleSyncWarningDownload}
        onCopy={handleSyncWarningCopy}
        itemName={syncWarningModal.item?.title || ""}
        itemType={syncWarningModal.type}
        isSaving={isSavingWithWarning}
      />

      {/* Mobile drawer overlay */}
      {mobileNavOpen && (
        <div
          className="dashboard-mobile-overlay"
          onClick={() => setMobileNavOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Left Sidebar */}
      <aside
        className={`dashboard-sidebar-left ${sidebarCollapsed ? "collapsed" : ""} ${
          mobileNavOpen ? "mobile-open" : ""
        }`}>
        <div className="dashboard-sidebar-header">
          <Link to="/" className="dashboard-logo-link" title="Back to home">
            <House size={20} weight="regular" />
            <span>Home</span>
          </Link>
          <button
            className="dashboard-sidebar-toggle"
            onClick={toggleSidebar}
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}>
            <SidebarSimple size={20} weight="regular" />
          </button>
          <button
            className="dashboard-mobile-close-btn"
            onClick={() => setMobileNavOpen(false)}
            aria-label="Close menu">
            <X size={20} weight="regular" />
          </button>
        </div>

        <nav className="dashboard-nav">
          {navSections.map((section) => (
            <SortableNavSection
              key={section.label}
              label={section.label}
              items={section.items}
              activeSection={activeSection}
              onSelect={(id) => {
                setActiveSection(id);
                setEditingItem(null);
                setMobileNavOpen(false);
              }}
            />
          ))}
        </nav>

        {/* User Profile / Demo Section at bottom of sidebar */}
        <div className="dashboard-sidebar-footer">
          {isDemo ? (
            <DemoSignInButton />
          ) : (
            <>
              <div className="dashboard-user-card">
                <div className="dashboard-user-info">
                  <span className="dashboard-user-name">Authenticated admin</span>
                </div>
              </div>
              <button
                className="dashboard-signout-btn"
                onClick={() => {
                  void handleDashboardSignOut();
                }}
                title="Sign out"
                disabled={isSigningOut}>
                <SignOut size={18} />
                <span>{isSigningOut ? "Signing out..." : "Sign out"}</span>
              </button>
            </>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="dashboard-main">
        {/* Header */}
        <header className="dashboard-header">
          <div className="dashboard-header-left">
            <button
              className="dashboard-mobile-menu-btn"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open menu">
              <List size={20} weight="regular" />
            </button>
            <h1 className="dashboard-title">
              {activeSection === "overview" && "Overview"}
              {activeSection === "posts" && "Posts"}
              {activeSection === "pages" && "Pages"}
              {activeSection === "post-editor" && "Edit Post"}
              {activeSection === "page-editor" && "Edit Page"}
              {activeSection === "write-post" && "Write Post"}
              {activeSection === "write-page" && "Write Page"}
              {activeSection === "ai-agent" && "AI Agent"}
              {activeSection === "newsletter" && "Subscribers"}
              {activeSection === "newsletter-send" && "Send Newsletter"}
              {activeSection === "newsletter-write-email" && "Write Email"}
              {activeSection === "newsletter-recent-sends" && "Recent Sends"}
              {activeSection === "newsletter-stats" && "Email Stats"}
              {activeSection === "import" && "Import URL"}
              {activeSection === "config" && "Site Config"}
              {activeSection === "index-html" && "Index HTML"}
              {activeSection === "stats" && "Analytics"}
              {activeSection === "sync" && "Sync Content"}
              {activeSection === "media" && "Media"}
              {activeSection === "drafts" && "Drafts Inbox"}
              {activeSection === "api-keys" && "API Keys"}
              {activeSection === "agent-ready" && "Agent Ready"}
              {activeSection === "x" && "X"}
              {activeSection === "docs" && "Docs"}
            </h1>
          </div>

          <div className="dashboard-header-center">
            <div className="dashboard-search">
              <MagnifyingGlass size={16} />
              <input
                type="text"
                placeholder="Search posts and pages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="dashboard-search-input"
              />
            </div>
          </div>

          <div className="dashboard-header-right">
            {!isDemo && (
              <>
                <button
                  className={`dashboard-sync-btn dev ${syncRunning === "sync:all" ? "running" : ""}`}
                  title={
                    syncServerAvailable
                      ? "Execute Sync Dev"
                      : "Copy sync command (server not running)"
                  }
                  onClick={() => {
                    if (syncServerAvailable) {
                      executeSync("sync:all", "Sync All (Dev)");
                    } else {
                      showCommandModal(
                        "Sync Development",
                        "npm run sync:all",
                        "Sync all content to development environment"
                      );
                    }
                  }}
                  disabled={syncRunning !== null}>
                  <ArrowsClockwise
                    size={16}
                    className={syncRunning === "sync:all" ? "spinning" : ""}
                  />
                  <span>{syncRunning === "sync:all" ? "Running..." : "Sync Dev"}</span>
                </button>
                <button
                  className={`dashboard-sync-btn prod ${syncRunning === "sync:all:prod" ? "running" : ""}`}
                  title={
                    syncServerAvailable
                      ? "Execute Sync Prod"
                      : "Copy sync command (server not running)"
                  }
                  onClick={() => {
                    if (syncServerAvailable) {
                      executeSync("sync:all:prod", "Sync All (Prod)");
                    } else {
                      showCommandModal(
                        "Sync Production",
                        "npm run sync:all:prod",
                        "Sync all content to production environment"
                      );
                    }
                  }}
                  disabled={syncRunning !== null}>
                  <ArrowsClockwise
                    size={16}
                    className={syncRunning === "sync:all:prod" ? "spinning" : ""}
                  />
                  <span>{syncRunning === "sync:all:prod" ? "Running..." : "Sync Prod"}</span>
                </button>
              </>
            )}
            <button className="dashboard-theme-btn" onClick={toggleTheme} title={`Theme: ${theme}`}>
              {theme === "dark" ? (
                <Moon size={18} weight="fill" />
              ) : (
                <Sun size={18} weight="fill" />
              )}
            </button>
            <button
              className="dashboard-font-btn"
              onClick={toggleFont}
              title={`Font: ${fontFamily}`}>
              <TextAa size={18} weight={fontFamily === "monospace" ? "fill" : "regular"} />
            </button>
            <button
              className="dashboard-font-btn dashboard-font-scale-btn"
              onClick={toggleFontScale}
              title={`Font size: ${fontScale}`}>
              <span aria-hidden="true">A</span>
              <span className="dashboard-font-scale-label">{fontScaleLabel}</span>
            </button>
          </div>
        </header>

        {/* Demo mode banner */}
        {isDemo && (
          <div className="dashboard-demo-banner">
            <Info size={16} weight="bold" />
            <span>
              Demo mode: your content resets every 30 minutes. Admins have full access.{" "}
              <a
                href="https://github.com/waynesutton/markdown-site"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "inherit", textDecoration: "underline" }}>
                Fork and set up your own
              </a>
            </span>
          </div>
        )}

        {/* Content Area */}
        <div className="dashboard-content">
          {/* Overview */}
          {activeSection === "overview" && (
            <OverviewSection
              posts={posts}
              pages={pages}
              isDemo={isDemo}
              onNavigate={(section) => setActiveSection(section)}
              onEditPost={handleEditPost}
            />
          )}

          {/* Posts List */}
          {activeSection === "posts" && (
            <PostsListView
              posts={filteredPosts}
              onEdit={handleEditPost}
              searchQuery={searchQuery}
              onDelete={handleDeletePost}
              isDemo={isDemo}
              isLoading={posts === undefined}
            />
          )}

          {/* Pages List */}
          {activeSection === "pages" && (
            <PagesListView
              pages={filteredPages}
              onEdit={handleEditPage}
              searchQuery={searchQuery}
              onDelete={handleDeletePage}
              isDemo={isDemo}
              isLoading={pages === undefined}
            />
          )}

          {/* Post/Page Editor */}
          {(activeSection === "post-editor" || activeSection === "page-editor") && editingItem && (
            <EditorView
              item={editingItem}
              type={editingType}
              showPreview={showPreview}
              setShowPreview={setShowPreview}
              setItem={setEditingItem}
              onDownload={handleDownloadMarkdown}
              onCopy={handleCopyMarkdown}
              onBack={() => setActiveSection(editingType === "post" ? "posts" : "pages")}
              onSave={editingType === "post" ? handleSavePost : handleSavePage}
            />
          )}

          {/* Write Post Section */}
          {activeSection === "write-post" && (
            <WriteSection
              contentType="post"
              sidebarCollapsed={sidebarCollapsed}
              setSidebarCollapsed={setSidebarCollapsed}
              addToast={addToast}
              setActiveSection={setActiveSection}
              isDemo={isDemo}
            />
          )}

          {/* Write Page Section */}
          {activeSection === "write-page" && (
            <WriteSection
              contentType="page"
              sidebarCollapsed={sidebarCollapsed}
              setSidebarCollapsed={setSidebarCollapsed}
              addToast={addToast}
              setActiveSection={setActiveSection}
              isDemo={isDemo}
            />
          )}

          {/* AI Agent Section */}
          {activeSection === "ai-agent" &&
            (isDemo ? <DemoSectionGate section="AI Agent" /> : <AIAgentSection />)}

          {/* Newsletter Subscribers */}
          {activeSection === "newsletter" &&
            (isDemo ? <DemoSectionGate section="Newsletter" /> : <NewsletterSubscribersSection />)}

          {/* Newsletter Send */}
          {activeSection === "newsletter-send" &&
            (isDemo ? (
              <DemoSectionGate section="Newsletter" />
            ) : (
              <NewsletterSendSection addToast={addToast} />
            ))}

          {/* Newsletter Write Email */}
          {activeSection === "newsletter-write-email" &&
            (isDemo ? (
              <DemoSectionGate section="Newsletter" />
            ) : (
              <NewsletterWriteEmailSection addToast={addToast} />
            ))}

          {/* Newsletter Recent Sends */}
          {activeSection === "newsletter-recent-sends" &&
            (isDemo ? <DemoSectionGate section="Newsletter" /> : <NewsletterRecentSendsSection />)}

          {/* Newsletter Stats */}
          {activeSection === "newsletter-stats" &&
            (isDemo ? <DemoSectionGate section="Newsletter" /> : <NewsletterStatsSection />)}

          {/* Import URL */}
          {activeSection === "import" &&
            (isDemo ? (
              <DemoSectionGate section="Import" />
            ) : (
              <ImportURLSection addToast={addToast} />
            ))}

          {/* Site Config */}
          {activeSection === "config" &&
            (isDemo ? (
              <DemoSectionGate section="Site Config" />
            ) : (
              <ConfigSection
                addToast={addToast}
                onNavigateToIndexHtml={() => setActiveSection("index-html")}
              />
            ))}

          {/* Index HTML */}
          {activeSection === "index-html" &&
            (isDemo ? (
              <DemoSectionGate section="Index HTML" />
            ) : (
              <IndexHtmlSection addToast={addToast} />
            ))}

          {/* Stats */}
          {activeSection === "stats" &&
            (isDemo ? <DemoSectionGate section="Analytics" /> : <StatsSection />)}

          {/* Sync */}
          {activeSection === "sync" &&
            (isDemo ? (
              <DemoSectionGate section="Sync" />
            ) : (
              <SyncSection
                showCommandModal={showCommandModal}
                executeSync={executeSync}
                syncOutput={syncOutput}
                syncRunning={syncRunning}
                syncServerAvailable={syncServerAvailable}
                syncOutputRef={syncOutputRef}
                setSyncOutput={setSyncOutput}
              />
            ))}

          {/* Media */}
          {activeSection === "media" &&
            (isDemo ? <DemoSectionGate section="Media" /> : <MediaLibrary />)}

          {/* Drafts Inbox (agent blog pipeline) */}
          {activeSection === "drafts" &&
            (isDemo ? (
              <DemoSectionGate section="Drafts Inbox" />
            ) : (
              <DraftsInbox
                addToast={addToast}
                onOpenPost={handleOpenPostBySlug}
              />
            ))}

          {/* Pipeline API Keys */}
          {activeSection === "api-keys" &&
            (isDemo ? (
              <DemoSectionGate section="API Keys" />
            ) : (
              <ApiKeysSection addToast={addToast} />
            ))}

          {/* Agent Ready discovery and widget controls */}
          {activeSection === "agent-ready" &&
            (isDemo ? <DemoSectionGate section="Agent Ready" /> : <AgentReadySection />)}

          {/* X account, compose, and tweet-to-draft import */}
          {activeSection === "x" &&
            (isDemo ? <DemoSectionGate section="X" /> : <XSection addToast={addToast} />)}

          {/* Internal docs (behind dashboard login) */}
          {activeSection === "docs" && <DashboardDocsSection />}
        </div>
      </main>
    </div>
  );
}

// Overview Section: greeting, quick actions, stat cards, recent posts
function OverviewSection({
  posts,
  pages,
  isDemo,
  onNavigate,
  onEditPost,
}: {
  posts: ContentItem[] | undefined;
  pages: ContentItem[] | undefined;
  isDemo: boolean;
  onNavigate: (section: DashboardSection) => void;
  onEditPost: (post: ContentItem) => void;
}) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const publishedPosts = posts?.filter((p) => p.published) ?? [];
  const draftPosts = posts?.filter((p) => !p.published) ?? [];
  const featuredPosts = posts?.filter((p) => p.featured) ?? [];
  const navPages = pages?.filter((p) => p.showInNav) ?? [];
  const tagSet = new Set<string>();
  for (const post of posts ?? []) {
    for (const tag of post.tags ?? []) tagSet.add(tag);
  }

  // Most recent posts by date (frontmatter date is YYYY-MM-DD, sortable as string)
  const recentPosts = [...(posts ?? [])]
    .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""))
    .slice(0, 5);
  const lastPublished = [...publishedPosts].sort((a, b) =>
    (b.date ?? "").localeCompare(a.date ?? "")
  )[0];

  const quickActions = [
    { id: "write-post" as const, label: "Write Post", icon: PencilSimple },
    { id: "write-page" as const, label: "Write Page", icon: File },
    { id: "import" as const, label: "Import URL", icon: CloudArrowDown },
    { id: "drafts" as const, label: "Drafts Inbox", icon: Tray },
    { id: "sync" as const, label: "Sync Content", icon: ArrowsClockwise },
  ];

  return (
    <div className="db-overview">
      <header className="db-overview-hero">
        <h2 className="db-greeting">{isDemo ? `${greeting}, explorer` : greeting}</h2>
        <p className="db-insight">
          {!posts ? (
            "Loading your content..."
          ) : draftPosts.length > 0 ? (
            <>
              <strong>
                {draftPosts.length} {draftPosts.length === 1 ? "draft" : "drafts"}
              </strong>{" "}
              waiting to publish, {publishedPosts.length} posts live.
            </>
          ) : (
            <>
              All <strong>{publishedPosts.length}</strong>{" "}
              {publishedPosts.length === 1 ? "post is" : "posts are"} live. Time to write
              something new.
            </>
          )}
        </p>
      </header>

      <div className="db-quick-actions">
        {quickActions.map((action) => (
          <button key={action.id} className="db-quick-action" onClick={() => onNavigate(action.id)}>
            <action.icon size={17} weight="regular" />
            <span>{action.label}</span>
          </button>
        ))}
      </div>

      <div className="db-stat-grid">
        <div className="db-stat-card">
          <span className="db-stat-label">Posts</span>
          <span className="db-stat-value">{posts ? posts.length : "–"}</span>
          <span className="db-stat-denominator">
            {publishedPosts.length} published · {draftPosts.length}{" "}
            {draftPosts.length === 1 ? "draft" : "drafts"}
          </span>
        </div>
        <div className="db-stat-card">
          <span className="db-stat-label">Pages</span>
          <span className="db-stat-value">{pages ? pages.length : "–"}</span>
          <span className="db-stat-denominator">{navPages.length} in navigation</span>
        </div>
        <div className="db-stat-card">
          <span className="db-stat-label">Tags</span>
          <span className="db-stat-value">{posts ? tagSet.size : "–"}</span>
          <span className="db-stat-denominator">across {posts?.length ?? 0} posts</span>
        </div>
        <div className="db-stat-card">
          <span className="db-stat-label">Last published</span>
          <span className="db-stat-value">{lastPublished?.date ?? "–"}</span>
          <span className="db-stat-denominator">
            {lastPublished ? lastPublished.title : `${featuredPosts.length} featured posts`}
          </span>
        </div>
      </div>

      <section className="db-recent">
        <div className="db-recent-header">
          <h3>Recent posts</h3>
          <button className="db-recent-viewall" onClick={() => onNavigate("posts")}>
            View all
          </button>
        </div>
        <div className="db-recent-list">
          {!posts ? (
            <div className="db-recent-empty">Loading...</div>
          ) : recentPosts.length === 0 ? (
            <div className="db-recent-empty">No posts yet. Write your first one.</div>
          ) : (
            recentPosts.map((post) => (
              <div key={post._id} className="db-recent-row">
                <div className="db-recent-main">
                  <span className="db-recent-title">{post.title}</span>
                  <span className="db-recent-slug">/{post.slug}</span>
                </div>
                <span className="db-recent-date">{post.date ?? ""}</span>
                <span className={`status-badge ${post.published ? "published" : "draft"}`}>
                  {post.published ? "Published" : "Draft"}
                </span>
                <button className="action-btn edit" onClick={() => onEditPost(post)} title="Edit">
                  <PencilSimple size={16} />
                </button>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

// Posts List View Component
function PostsListView({
  posts,
  onEdit,
  searchQuery,
  onDelete,
  isDemo = false,
  isLoading = false,
}: {
  posts: ContentItem[];
  onEdit: (post: ContentItem) => void;
  searchQuery: string;
  onDelete: (item: ContentItem) => void;
  isDemo?: boolean;
  isLoading?: boolean;
}) {
  const [filter, setFilter] = useState<"all" | "published" | "draft" | "unlisted">("all");
  const [itemsPerPage, setItemsPerPage] = useState<number>(MIN_PAGE_SIZE);
  const [currentPage, setCurrentPage] = useState(0);

  // Track which row's live URL was just copied for button feedback
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyUrl = (item: ContentItem) => {
    void navigator.clipboard.writeText(`${window.location.origin}/${item.slug}`);
    setCopiedId(item._id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredPosts = useMemo(() => {
    let filtered = posts;
    if (filter === "published") filtered = posts.filter((p) => p.published);
    if (filter === "draft") filtered = posts.filter((p) => !p.published);
    if (filter === "unlisted") filtered = posts.filter((p) => p.unlisted);

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(query) ||
          p.slug.toLowerCase().includes(query) ||
          (p.description && p.description.toLowerCase().includes(query)) ||
          (p.content && p.content.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [posts, filter, searchQuery]);

  const paginatedPosts = useMemo(() => {
    const start = currentPage * itemsPerPage;
    return filteredPosts.slice(start, start + itemsPerPage);
  }, [filteredPosts, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredPosts.length / itemsPerPage);
  const hasNextPage = currentPage < totalPages - 1;
  const hasPrevPage = currentPage > 0;

  const handlePrevPage = () => {
    if (hasPrevPage) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (hasNextPage) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handleFilterChange = (newFilter: "all" | "published" | "draft" | "unlisted") => {
    setFilter(newFilter);
    setCurrentPage(0); // Reset to first page when filter changes
  };

  return (
    <div className="dashboard-list-view">
      <div className="dashboard-list-header">
        <div className="dashboard-filter-tabs">
          <button
            className={`dashboard-filter-tab ${filter === "all" ? "active" : ""}`}
            onClick={() => handleFilterChange("all")}>
            All ({posts.length})
          </button>
          <button
            className={`dashboard-filter-tab ${filter === "published" ? "active" : ""}`}
            onClick={() => handleFilterChange("published")}>
            Published ({posts.filter((p) => p.published).length})
          </button>
          <button
            className={`dashboard-filter-tab ${filter === "draft" ? "active" : ""}`}
            onClick={() => handleFilterChange("draft")}>
            Drafts ({posts.filter((p) => !p.published).length})
          </button>
          <button
            className={`dashboard-filter-tab ${filter === "unlisted" ? "active" : ""}`}
            onClick={() => handleFilterChange("unlisted")}>
            Unlisted ({posts.filter((p) => p.unlisted).length})
          </button>
        </div>
      </div>

      <div className="dashboard-list-table">
        <div className="dashboard-list-table-header">
          <span className="col-title">Title</span>
          <span className="col-date">Date</span>
          <span className="col-status">Status</span>
          <span className="col-actions">Actions</span>
        </div>

        {isLoading ? (
          <div className="dashboard-list-empty">Loading posts...</div>
        ) : filteredPosts.length === 0 ? (
          <div className="dashboard-list-empty">
            {searchQuery ? "No posts match your search" : "No posts found"}
          </div>
        ) : (
          paginatedPosts.map((post) => (
            <div key={post._id} className="dashboard-list-row">
              <div className="col-title">
                {/* Clicking the title opens the editor, same gating as the edit icon */}
                {!isDemo || post.source === "demo" ? (
                  <button
                    type="button"
                    className="post-title post-title-link"
                    onClick={() => onEdit(post as ContentItem)}
                    title="Edit">
                    {post.title}
                  </button>
                ) : (
                  <span className="post-title">{post.title}</span>
                )}
                <span className="post-slug">/{post.slug}</span>
              </div>
              <div className="col-date">
                <Clock size={14} />
                <span>{post.date || "No date"}</span>
              </div>
              <div className="col-status">
                <span className={`status-badge ${post.published ? "published" : "draft"}`}>
                  {post.published ? "Published" : "Draft"}
                </span>
                {post.unlisted && <span className="status-badge unlisted">Unlisted</span>}
                {post.source === "demo" && <span className="source-badge demo">Demo</span>}
                {post.source === "dashboard" && (
                  <span className="source-badge dashboard">Dashboard</span>
                )}
                {(!post.source || post.source === "sync") && (
                  <span className="source-badge sync">Synced</span>
                )}
              </div>
              <div className="col-actions">
                {/* In demo mode, only allow editing demo content */}
                {(!isDemo || post.source === "demo") && (
                  <button
                    className="action-btn edit"
                    onClick={() => onEdit(post as ContentItem)}
                    title="Edit">
                    <PencilSimple size={16} />
                  </button>
                )}
                {/* Published content is live even when unlisted, so link straight to it */}
                {post.published && (
                  <Link
                    to={`/${post.slug}`}
                    className="action-btn view"
                    title="Open live page"
                    target="_blank"
                    rel="noopener noreferrer">
                    <ArrowSquareOut size={16} />
                  </Link>
                )}
                {/* Unlisted posts are shared by direct URL, so offer a quick copy */}
                {post.unlisted && (
                  <button
                    className="action-btn view"
                    onClick={() => handleCopyUrl(post as ContentItem)}
                    title="Copy live URL">
                    {copiedId === post._id ? <Check size={16} /> : <LinkIcon size={16} />}
                  </button>
                )}
                {/* Delete: admin can delete dashboard posts; demo can delete demo posts */}
                {((!isDemo && post.source === "dashboard") ||
                  (isDemo && post.source === "demo")) && (
                  <button
                    className="action-btn delete"
                    onClick={() => onDelete(post as ContentItem)}
                    title="Delete">
                    <Trash size={16} />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination, with items-per-page alongside it since both control what the page holds */}
      {filteredPosts.length > MIN_PAGE_SIZE && (
        <div className="dashboard-pagination">
          {totalPages > 1 && (
            <div className="dashboard-pagination-nav">
              <button
                onClick={() => setCurrentPage(0)}
                disabled={!hasPrevPage}
                className="dashboard-pagination-btn dashboard-pagination-first"
                title="First page">
                <CaretDoubleLeft size={16} />
              </button>
              <button
                onClick={handlePrevPage}
                disabled={!hasPrevPage}
                className="dashboard-pagination-btn">
                <CaretLeft size={16} />
                Previous
              </button>
              <span className="dashboard-pagination-status">
                Page {currentPage + 1} of {totalPages}
              </span>
              <button
                onClick={handleNextPage}
                disabled={!hasNextPage}
                className="dashboard-pagination-btn">
                Next
                <CaretRight size={16} />
              </button>
            </div>
          )}
          <div className="dashboard-items-per-page">
            <label htmlFor="posts-per-page" className="dashboard-items-label">
              Show:
            </label>
            <select
              id="posts-per-page"
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(0);
              }}
              className="dashboard-items-select">
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}

// Pages List View Component
function PagesListView({
  pages,
  onEdit,
  searchQuery,
  onDelete,
  isDemo = false,
  isLoading = false,
}: {
  pages: ContentItem[];
  onEdit: (page: ContentItem) => void;
  searchQuery: string;
  onDelete: (item: ContentItem) => void;
  isDemo?: boolean;
  isLoading?: boolean;
}) {
  const [filter, setFilter] = useState<"all" | "published" | "draft" | "unlisted">("all");
  const [itemsPerPage, setItemsPerPage] = useState<number>(MIN_PAGE_SIZE);
  const [currentPage, setCurrentPage] = useState(0);

  // Track which row's live URL was just copied for button feedback
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyUrl = (item: ContentItem) => {
    void navigator.clipboard.writeText(`${window.location.origin}/${item.slug}`);
    setCopiedId(item._id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredPages = useMemo(() => {
    let filtered = pages;
    if (filter === "published") filtered = pages.filter((p) => p.published);
    if (filter === "draft") filtered = pages.filter((p) => !p.published);
    if (filter === "unlisted") filtered = pages.filter((p) => p.unlisted);

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(query) ||
          p.slug.toLowerCase().includes(query) ||
          (p.content && p.content.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [pages, filter, searchQuery]);

  const paginatedPages = useMemo(() => {
    const start = currentPage * itemsPerPage;
    return filteredPages.slice(start, start + itemsPerPage);
  }, [filteredPages, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredPages.length / itemsPerPage);
  const hasNextPage = currentPage < totalPages - 1;
  const hasPrevPage = currentPage > 0;

  const handlePrevPage = () => {
    if (hasPrevPage) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (hasNextPage) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handleFilterChange = (newFilter: "all" | "published" | "draft" | "unlisted") => {
    setFilter(newFilter);
    setCurrentPage(0); // Reset to first page when filter changes
  };

  return (
    <div className="dashboard-list-view">
      <div className="dashboard-list-header">
        <div className="dashboard-filter-tabs">
          <button
            className={`dashboard-filter-tab ${filter === "all" ? "active" : ""}`}
            onClick={() => handleFilterChange("all")}>
            All ({pages.length})
          </button>
          <button
            className={`dashboard-filter-tab ${filter === "published" ? "active" : ""}`}
            onClick={() => handleFilterChange("published")}>
            Published ({pages.filter((p) => p.published).length})
          </button>
          <button
            className={`dashboard-filter-tab ${filter === "draft" ? "active" : ""}`}
            onClick={() => handleFilterChange("draft")}>
            Drafts ({pages.filter((p) => !p.published).length})
          </button>
          <button
            className={`dashboard-filter-tab ${filter === "unlisted" ? "active" : ""}`}
            onClick={() => handleFilterChange("unlisted")}>
            Unlisted ({pages.filter((p) => p.unlisted).length})
          </button>
        </div>
      </div>

      <div className="dashboard-list-table">
        <div className="dashboard-list-table-header">
          <span className="col-title">Title</span>
          <span className="col-order">Order</span>
          <span className="col-status">Status</span>
          <span className="col-actions">Actions</span>
        </div>

        {isLoading ? (
          <div className="dashboard-list-empty">Loading pages...</div>
        ) : filteredPages.length === 0 ? (
          <div className="dashboard-list-empty">
            {searchQuery ? "No pages match your search" : "No pages found"}
          </div>
        ) : (
          paginatedPages.map((page) => (
            <div key={page._id} className="dashboard-list-row">
              <div className="col-title">
                {/* Clicking the title opens the editor, same gating as the edit icon */}
                {!isDemo || page.source === "demo" ? (
                  <button
                    type="button"
                    className="post-title post-title-link"
                    onClick={() => onEdit(page as ContentItem)}
                    title="Edit">
                    {page.title}
                  </button>
                ) : (
                  <span className="post-title">{page.title}</span>
                )}
                <span className="post-slug">/{page.slug}</span>
              </div>
              <div className="col-order">{page.order !== undefined ? page.order : "-"}</div>
              <div className="col-status">
                <span className={`status-badge ${page.published ? "published" : "draft"}`}>
                  {page.published ? "Published" : "Draft"}
                </span>
                {page.unlisted && <span className="status-badge unlisted">Unlisted</span>}
                {page.source === "demo" && <span className="source-badge demo">Demo</span>}
                {page.source === "dashboard" && (
                  <span className="source-badge dashboard">Dashboard</span>
                )}
                {(!page.source || page.source === "sync") && (
                  <span className="source-badge sync">Synced</span>
                )}
              </div>
              <div className="col-actions">
                {(!isDemo || page.source === "demo") && (
                  <button
                    className="action-btn edit"
                    onClick={() => onEdit(page as ContentItem)}
                    title="Edit">
                    <PencilSimple size={16} />
                  </button>
                )}
                {/* Published content is live even when unlisted, so link straight to it */}
                {page.published && (
                  <Link
                    to={`/${page.slug}`}
                    className="action-btn view"
                    title="Open live page"
                    target="_blank"
                    rel="noopener noreferrer">
                    <ArrowSquareOut size={16} />
                  </Link>
                )}
                {/* Unlisted pages are shared by direct URL, so offer a quick copy */}
                {page.unlisted && (
                  <button
                    className="action-btn view"
                    onClick={() => handleCopyUrl(page as ContentItem)}
                    title="Copy live URL">
                    {copiedId === page._id ? <Check size={16} /> : <LinkIcon size={16} />}
                  </button>
                )}
                {((!isDemo && page.source === "dashboard") ||
                  (isDemo && page.source === "demo")) && (
                  <button
                    className="action-btn delete"
                    onClick={() => onDelete(page as ContentItem)}
                    title="Delete">
                    <Trash size={16} />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination, with items-per-page alongside it since both control what the page holds */}
      {filteredPages.length > MIN_PAGE_SIZE && (
        <div className="dashboard-pagination">
          {totalPages > 1 && (
            <div className="dashboard-pagination-nav">
              <button
                onClick={() => setCurrentPage(0)}
                disabled={!hasPrevPage}
                className="dashboard-pagination-btn dashboard-pagination-first"
                title="First page">
                <CaretDoubleLeft size={16} />
              </button>
              <button
                onClick={handlePrevPage}
                disabled={!hasPrevPage}
                className="dashboard-pagination-btn">
                <CaretLeft size={16} />
                Previous
              </button>
              <span className="dashboard-pagination-status">
                Page {currentPage + 1} of {totalPages}
              </span>
              <button
                onClick={handleNextPage}
                disabled={!hasNextPage}
                className="dashboard-pagination-btn">
                Next
                <CaretRight size={16} />
              </button>
            </div>
          )}
          <div className="dashboard-items-per-page">
            <label htmlFor="pages-per-page" className="dashboard-items-label">
              Show:
            </label>
            <select
              id="pages-per-page"
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(0);
              }}
              className="dashboard-items-select">
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}

// Collapse state that survives a reload, the same way the sidebar width does.
function usePersistedOpen(storageKey: string, defaultOpen: boolean) {
  const [open, setOpen] = useState<boolean>(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      return raw === null ? defaultOpen : raw === "1";
    } catch {
      return defaultOpen;
    }
  });

  const toggle = useCallback(() => {
    setOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(storageKey, next ? "1" : "0");
      } catch {
        // Persistence is best-effort; the toggle still works this session.
      }
      return next;
    });
  }, [storageKey]);

  return [open, toggle] as const;
}

// Collapsible card wrapping the markdown body. The header keeps a word and
// line denominator visible so a collapsed body still reports its size.
function BodyCard({
  open,
  onToggle,
  content,
  showMeta = true,
  children,
}: {
  open: boolean;
  onToggle: () => void;
  content: string;
  // Write flow already reports stats in its footer, so it hides the header meta
  showMeta?: boolean;
  children: React.ReactNode;
}) {
  const words = content.trim() === "" ? 0 : content.trim().split(/\s+/).length;
  const lines = content === "" ? 0 : content.split("\n").length;

  return (
    <section className={`dashboard-body-card ${open ? "open" : ""}`}>
      <button type="button" className="dashboard-body-head" aria-expanded={open} onClick={onToggle}>
        <CaretDown size={13} weight="bold" className="dashboard-body-caret" />
        <span className="dashboard-body-title">Content</span>
        {showMeta && (
          <span className="dashboard-body-meta">
            {words} words <span className="dashboard-body-meta-sep">·</span> {lines} lines
          </span>
        )}
      </button>
      {open && <div className="dashboard-body-inner">{children}</div>}
    </section>
  );
}

// Editor View Component
function EditorView({
  item,
  type,
  showPreview,
  setShowPreview,
  setItem,
  onDownload,
  onCopy,
  onBack,
  onSave,
}: {
  item: ContentItem;
  type: "post" | "page";
  showPreview: boolean;
  setShowPreview: (show: boolean) => void;
  setItem: (item: ContentItem) => void;
  onDownload: () => void;
  onCopy: () => void;
  onBack: () => void;
  onSave: (item: ContentItem) => Promise<void>;
}) {
  const [copied, setCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  // Which frontmatter image field the upload modal fills (null when closed)
  const [fmImageField, setFmImageField] = useState<FrontmatterImageField | null>(null);
  const versionControlEnabled = useQuery(api.versions.isEnabled);
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem("dashboard-sidebar-width");
    return saved ? Number(saved) : 280;
  });
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [bodyOpen, toggleBody] = usePersistedOpen("dashboard-editor-body-open", true);

  const handleCopy = async () => {
    await onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(item);
    } finally {
      setIsSaving(false);
    }
  };

  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!sidebarRef.current) return;

      setIsResizing(true);
      startXRef.current = e.clientX;
      startWidthRef.current = sidebarWidth;
    },
    [sidebarWidth]
  );

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = startXRef.current - e.clientX; // Negative when dragging left (making sidebar wider)
      const newWidth = startWidthRef.current + deltaX;

      // Constrain width between 200px and 600px
      const constrainedWidth = Math.max(200, Math.min(600, newWidth));
      setSidebarWidth(constrainedWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      localStorage.setItem("dashboard-sidebar-width", String(sidebarWidth));
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, sidebarWidth]);

  return (
    <div className="dashboard-editor">
      {/* Two tiers: navigation plus the view switch lead, utilities trail.
          Save lives here on desktop and in the sticky bar on mobile. */}
      <div className="dashboard-editor-toolbar">
        <div className="dashboard-editor-lead">
          <button className="dashboard-back-btn" onClick={onBack}>
            <ArrowLeft size={16} />
            <span>Back to {type === "post" ? "Posts" : "Pages"}</span>
          </button>
          <div className="dashboard-seg" role="group" aria-label="Editor view">
            <button
              className={`dashboard-seg-btn ${!showPreview ? "active" : ""}`}
              aria-pressed={!showPreview}
              onClick={() => setShowPreview(false)}>
              Markdown
            </button>
            <button
              className={`dashboard-seg-btn ${showPreview ? "active" : ""}`}
              aria-pressed={showPreview}
              onClick={() => setShowPreview(true)}>
              Preview
            </button>
          </div>
        </div>
        <div className="dashboard-editor-actions">
          <button className="dashboard-action-btn" onClick={handleCopy} title="Copy Markdown">
            {copied ? <Check size={16} /> : <Copy size={16} />}
            <span>{copied ? "Copied" : "Copy"}</span>
          </button>
          {/* Published content is live even when unlisted, so link straight to it */}
          {item.published && item.slug && (
            <a
              className="dashboard-action-btn"
              href={`/${item.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              title="Open live page">
              <ArrowSquareOut size={16} />
              <span>Open</span>
            </a>
          )}
          {versionControlEnabled && (
            <button
              className="dashboard-action-btn"
              onClick={() => setShowVersionHistory(true)}
              title="View Version History">
              <ClockCounterClockwise size={16} />
              <span>History</span>
            </button>
          )}
          <button
            className="dashboard-action-btn primary"
            onClick={onDownload}
            title="Download Markdown">
            <Download size={16} />
            <span>Download .md</span>
          </button>
          <button
            className="dashboard-action-btn success dashboard-save-inline"
            onClick={handleSave}
            disabled={isSaving}
            title="Save to Database">
            {isSaving ? (
              <SpinnerGap size={16} className="animate-spin" />
            ) : (
              <FloppyDisk size={16} />
            )}
            <span>{isSaving ? "Saving..." : "Save"}</span>
          </button>
        </div>
      </div>

      <div className="dashboard-editor-container">
        <div className="dashboard-editor-content">
          <BodyCard open={bodyOpen} onToggle={toggleBody} content={item.content}>
            {showPreview ? (
              <div className="dashboard-preview">
                <div className="dashboard-preview-content">
                  <h1 className="blog-h1">{item.title}</h1>
                  {item.description && <p className="lead">{item.description}</p>}
                  {item.aiWritten && (
                    <p className="post-ai-note" role="note">
                      This post was written with AI and proofed by a human.
                    </p>
                  )}
                  <div className="blog-post-content">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm, remarkBreaks]}
                      rehypePlugins={[rehypeRaw, [rehypeSanitize, defaultSchema]]}>
                      {item.content}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            ) : (
              <textarea
                className="dashboard-textarea"
                value={item.content}
                onChange={(e) => setItem({ ...item, content: e.target.value })}
                placeholder="Write your content here..."
              />
            )}
          </BodyCard>
        </div>

        <div
          ref={sidebarRef}
          className={`dashboard-editor-sidebar ${isResizing ? "resizing" : ""}`}
          style={{ width: `${sidebarWidth}px` }}>
          <div
            className="dashboard-sidebar-resize-handle"
            onMouseDown={handleMouseDown}
            title="Drag to resize"
          />
          <div className="fmf-panel">
            <h3 className="fmf-panel-title">Frontmatter</h3>
            <FrontmatterForm
              kind={type}
              value={itemToFrontmatter(item)}
              onChange={(next) => setItem(applyFrontmatterToItem(item, type, next))}
              onRequestImage={
                siteConfig.media?.enabled ? (field) => setFmImageField(field) : undefined
              }
            />
            <AdditionalFieldsPanel item={item} type={type} setItem={setItem} />
          </div>
        </div>
      </div>

      {/* Mobile only: Save can never scroll out of reach */}
      <div className="dashboard-editor-savebar">
        <button
          className="dashboard-action-btn success"
          onClick={handleSave}
          disabled={isSaving}
          title="Save to Database">
          {isSaving ? <SpinnerGap size={16} className="animate-spin" /> : <FloppyDisk size={16} />}
          <span>{isSaving ? "Saving..." : "Save"}</span>
        </button>
      </div>

      {fmImageField !== null && (
        <ImageUploadModal
          isOpen={fmImageField !== null}
          onClose={() => setFmImageField(null)}
          onSelectUrl={(url) => {
            setItem({ ...item, [fmImageField]: url });
            setFmImageField(null);
          }}
        />
      )}

      {showVersionHistory && (
        <VersionHistoryModal
          isOpen={showVersionHistory}
          onClose={() => setShowVersionHistory(false)}
          contentType={type}
          contentId={item._id}
          currentContent={item.content}
          currentTitle={item.title}
        />
      )}
    </div>
  );
}

// Additional (less common) frontmatter fields for the edit flows. Renders
// every persisted ContentItem field not covered by FrontmatterForm so no
// editing capability is lost.
function AdditionalFieldsPanel({
  item,
  type,
  setItem,
}: {
  item: ContentItem;
  type: "post" | "page";
  setItem: (item: ContentItem) => void;
}) {
  const [open, setOpen] = useState(false);
  const fields = (type === "post" ? postFrontmatterFields : pageFrontmatterFields).filter(
    (field) => !FORM_MANAGED_KEYS.has(field.key)
  );

  const handleFieldChange = (key: string, value: unknown) => {
    setItem({ ...item, [key]: value });
  };

  return (
    <div className="fmf-additional">
      <div className="fmf-section">
        <button
          type="button"
          className="fmf-section-toggle"
          onClick={() => setOpen((prev) => !prev)}
          aria-expanded={open}>
          {open ? <CaretDown size={14} /> : <CaretRight size={14} />}
          <span>Additional fields</span>
        </button>
        {open && (
          <div className="fmf-section-body">
            {fields.map((field) => {
              const rawValue = item[field.key as keyof ContentItem];

              if (field.type === "checkbox") {
                return (
                  <label key={field.key} className="fmf-switch">
                    <input
                      type="checkbox"
                      checked={Boolean(rawValue)}
                      onChange={(e) => handleFieldChange(field.key, e.target.checked)}
                    />
                    <span className="fmf-switch-track" aria-hidden="true">
                      <span className="fmf-switch-thumb" />
                    </span>
                    <span className="fmf-switch-label">{field.label}</span>
                  </label>
                );
              }

              if (field.type === "textarea") {
                return (
                  <div key={field.key} className="fmf-field">
                    <label className="fmf-label">{field.label}</label>
                    <textarea
                      className="fmf-textarea"
                      value={String(rawValue ?? "")}
                      onChange={(e) => handleFieldChange(field.key, e.target.value)}
                      placeholder={field.label}
                      rows={2}
                    />
                  </div>
                );
              }

              if (field.type === "number") {
                return (
                  <div key={field.key} className="fmf-field">
                    <label className="fmf-label">{field.label}</label>
                    <input
                      type="number"
                      className="fmf-input"
                      value={rawValue === undefined || rawValue === null ? "" : String(rawValue)}
                      onChange={(e) =>
                        handleFieldChange(
                          field.key,
                          e.target.value === "" ? undefined : Number(e.target.value)
                        )
                      }
                      placeholder={field.label}
                    />
                  </div>
                );
              }

              if (field.type === "select" && field.options) {
                return (
                  <div key={field.key} className="fmf-field">
                    <label className="fmf-label">{field.label}</label>
                    <select
                      className="fmf-select"
                      value={String(rawValue ?? "")}
                      onChange={(e) => handleFieldChange(field.key, e.target.value || undefined)}>
                      {field.options.map((option) => (
                        <option key={option} value={option}>
                          {option === "" ? "Default" : option}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              }

              return (
                <div key={field.key} className="fmf-field">
                  <label className="fmf-label">{field.label}</label>
                  <input
                    type="text"
                    className="fmf-input"
                    value={String(rawValue ?? "")}
                    onChange={(e) => handleFieldChange(field.key, e.target.value || undefined)}
                    placeholder={field.label}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// Generate the starter markdown BODY for the write editor. Frontmatter is
// managed by the FrontmatterForm and serialized separately.
function generateWriteBodyTemplate(type: "post" | "page", isDemo: boolean = false): string {
  if (type === "post") {
    return `# Your post title

Start writing your content here...${isDemo ? " Demo posts reset every 30 minutes." : ""}

## Section heading

Add your markdown content. You can use:

- **Bold text** and *italic text*
- [Links](https://example.com)
- Code blocks with syntax highlighting

\`\`\`typescript
const greeting = "Hello, world";
console.log(greeting);
\`\`\`
`;
  }

  return `# Page title

Your page content goes here...${isDemo ? " Demo pages reset every 30 minutes." : ""}

## Section

Add your markdown content.
`;
}

// localStorage keys for dashboard write
const DASHBOARD_WRITE_POST_CONTENT = "dashboard_write_post_content";
const DASHBOARD_WRITE_PAGE_CONTENT = "dashboard_write_page_content";
const DASHBOARD_WRITE_FOCUS_MODE = "dashboard_write_focus_mode";
const DASHBOARD_WRITE_FRONTMATTER_COLLAPSED = "dashboard_write_frontmatter_collapsed";

function WriteSection({
  contentType,
  sidebarCollapsed,
  setSidebarCollapsed,
  addToast,
  setActiveSection,
  isDemo = false,
}: {
  contentType: "post" | "page";
  sidebarCollapsed: boolean;
  setSidebarCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  addToast: (message: string, type?: ToastType) => void;
  setActiveSection: (section: DashboardSection) => void;
  isDemo?: boolean;
}) {
  // Frontmatter form state + markdown body (body contains no YAML)
  const [frontmatter, setFrontmatter] = useState<FrontmatterValues>(() =>
    createDefaultFrontmatter(contentType)
  );
  const [body, setBody] = useState("");
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editorMode, setEditorMode] = useState<"markdown" | "richtext" | "preview">("markdown");
  const createPostMutation = useMutation(api.cms.createPost);
  const createPageMutation = useMutation(api.cms.createPage);
  const createDemoPostMutation = useMutation(api.demo.createDemoPost);
  const createDemoPageMutation = useMutation(api.demo.createDemoPage);
  // Share on X after publishing (posts only, needs a connected account)
  const xStatus = useQuery(api.xIntegration.getXStatus, isDemo ? "skip" : {});
  const sharePublishedPost = useAction(api.xIntegration.sharePublishedPost);
  const [shareOnX, setShareOnX] = useState(false);
  const [copied, setCopied] = useState(false);
  const [focusMode, setFocusMode] = useState(() => {
    const saved = localStorage.getItem(DASHBOARD_WRITE_FOCUS_MODE);
    return saved === "true";
  });
  const [frontmatterCollapsed, setFrontmatterCollapsed] = useState(() => {
    const saved = localStorage.getItem(DASHBOARD_WRITE_FRONTMATTER_COLLAPSED);
    // Default to collapsed in focus mode
    return saved === "true";
  });
  // Store previous sidebar state before entering focus mode
  const [prevSidebarState, setPrevSidebarState] = useState<boolean | null>(null);
  // Collapsing the body brings the frontmatter groups into reach on mobile
  const [bodyOpen, toggleBody] = usePersistedOpen("dashboard:write:body-open", true);
  // Image upload modal state
  const [showImageUpload, setShowImageUpload] = useState(false);
  // Which frontmatter image field the upload modal fills (null when closed)
  const [fmImageField, setFmImageField] = useState<FrontmatterImageField | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const richTextRef = useRef<HTMLDivElement>(null);

  // Toggle focus mode
  const toggleFocusMode = useCallback(() => {
    setFocusMode((prev) => {
      const newValue = !prev;
      localStorage.setItem(DASHBOARD_WRITE_FOCUS_MODE, String(newValue));
      // When entering focus mode, save sidebar state and collapse it
      if (newValue) {
        setPrevSidebarState(sidebarCollapsed);
        setSidebarCollapsed(true);
        setFrontmatterCollapsed(true);
        localStorage.setItem(DASHBOARD_WRITE_FRONTMATTER_COLLAPSED, "true");
      } else {
        // When exiting focus mode, restore previous sidebar state
        if (prevSidebarState !== null) {
          setSidebarCollapsed(prevSidebarState);
        }
      }
      return newValue;
    });
  }, [sidebarCollapsed, setSidebarCollapsed, prevSidebarState]);

  // Toggle frontmatter sidebar
  const toggleFrontmatter = useCallback(() => {
    setFrontmatterCollapsed((prev) => {
      const newValue = !prev;
      localStorage.setItem(DASHBOARD_WRITE_FRONTMATTER_COLLAPSED, String(newValue));
      return newValue;
    });
  }, []);

  // HTML <-> Markdown converters
  const turndownService = useMemo(() => {
    const service = new TurndownService({
      headingStyle: "atx",
      codeBlockStyle: "fenced",
    });
    return service;
  }, []);

  const markedInstance = useMemo(() => {
    const instance = new Marked({ gfm: true, breaks: false });
    return instance;
  }, []);

  // State for rich text HTML content
  const [richTextHtml, setRichTextHtml] = useState("");

  // Handle mode changes with content conversion (body only; frontmatter is
  // managed by the form and never round-trips through rich text)
  const handleModeChange = useCallback(
    (newMode: "markdown" | "richtext" | "preview") => {
      if (newMode === editorMode) return;

      if (newMode === "richtext" && editorMode === "markdown") {
        // Converting from markdown to rich text
        const html = markedInstance.parse(body) as string;
        setRichTextHtml(html);
      } else if (newMode === "markdown" && editorMode === "richtext") {
        // Converting from rich text back to markdown
        const markdown = turndownService.turndown(richTextHtml);
        setBody(markdown);
      }

      setEditorMode(newMode);
    },
    [editorMode, body, richTextHtml, markedInstance, turndownService]
  );

  // Run a rich text command on the contenteditable editor
  const applyRichTextCommand = useCallback(
    (command: string, value?: string) => {
      if (editorMode !== "richtext" || !richTextRef.current) {
        return;
      }
      richTextRef.current.focus();
      document.execCommand(command, false, value);
      setRichTextHtml(richTextRef.current.innerHTML);
    },
    [editorMode]
  );

  // Keep rich text HTML state in sync with contenteditable DOM changes
  const handleRichTextInput = useCallback(() => {
    if (!richTextRef.current) {
      return;
    }
    setRichTextHtml(richTextRef.current.innerHTML);
  }, []);

  // Keyboard shortcut: Escape to exit focus mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && focusMode) {
        e.preventDefault();
        toggleFocusMode();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [focusMode, toggleFocusMode]);

  // localStorage key based on content type
  const storageKey =
    contentType === "post" ? DASHBOARD_WRITE_POST_CONTENT : DASHBOARD_WRITE_PAGE_CONTENT;

  // Full markdown document (YAML frontmatter block + body), kept identical to
  // what gets copied, downloaded, and stored as a draft
  const fullContent = useMemo(
    () => serializeFrontmatter(contentType, frontmatter) + "\n" + body,
    [contentType, frontmatter, body]
  );

  // Restore draft from localStorage on mount. Older drafts stored the raw
  // markdown with a YAML block, so parse it to populate the form and body.
  useEffect(() => {
    const savedContent = localStorage.getItem(storageKey);
    if (savedContent && savedContent.trim() !== "") {
      const parsed = parseFrontmatterDocument(savedContent, contentType);
      setFrontmatter(parsed.values);
      setBody(parsed.hasFrontmatter ? parsed.body : savedContent);
    } else {
      setFrontmatter(createDefaultFrontmatter(contentType));
      setBody(generateWriteBodyTemplate(contentType, isDemo));
    }
    setDraftLoaded(true);
  }, [storageKey, contentType, isDemo]);

  // Autosave the full markdown draft (frontmatter + body) on change
  useEffect(() => {
    if (!draftLoaded) return;
    localStorage.setItem(storageKey, fullContent);
  }, [fullContent, storageKey, draftLoaded]);

  // Copy the full markdown document (frontmatter + body) to clipboard
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(fullContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textarea = document.createElement("textarea");
      textarea.value = fullContent;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [fullContent]);

  // Insert image markdown at cursor position
  const handleInsertImage = useCallback(
    (markdown: string) => {
      if (editorMode === "markdown" && textareaRef.current) {
        const textarea = textareaRef.current;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const newBody = body.substring(0, start) + markdown + "\n" + body.substring(end);
        setBody(newBody);
        // Set cursor position after inserted text
        setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(start + markdown.length + 1, start + markdown.length + 1);
        }, 0);
      } else if (editorMode === "richtext") {
        // For rich text mode, insert image at cursor when possible
        const imgMatch = markdown.match(/!\[(.*?)\]\((.*?)\)/);
        if (imgMatch) {
          const escapeAttr = (value: string) =>
            value.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
          const alt = escapeAttr(imgMatch[1]);
          const src = escapeAttr(imgMatch[2]);
          const imageHtml = `<p><img src="${src}" alt="${alt}" /></p>`;

          if (richTextRef.current) {
            richTextRef.current.focus();
            document.execCommand("insertHTML", false, imageHtml);
            setRichTextHtml(richTextRef.current.innerHTML);
          } else {
            setRichTextHtml((prev) => prev + imageHtml);
          }
        }
      } else {
        // Preview mode - append to body
        setBody((prev) => prev + "\n" + markdown);
      }
    },
    [body, editorMode]
  );

  // Clear form and body, reset to defaults
  const handleClear = useCallback(() => {
    setFrontmatter(createDefaultFrontmatter(contentType));
    setBody(generateWriteBodyTemplate(contentType, isDemo));
  }, [contentType, isDemo]);

  // Download the full markdown file (serialized frontmatter + body)
  const handleDownloadMarkdown = useCallback(() => {
    const slug =
      frontmatter.slug.trim() !== ""
        ? frontmatter.slug.trim()
        : contentType === "post"
          ? "your-post-url"
          : "your-page-url";

    const blob = new Blob([fullContent], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${slug}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [fullContent, frontmatter.slug, contentType]);

  // Save form state + body to the database
  const handleSaveToDb = useCallback(async () => {
    setIsSaving(true);
    try {
      // If the editor is in rich text mode, convert the latest HTML back to
      // markdown so unsaved rich text edits are not lost
      const bodyContent = (
        editorMode === "richtext" ? turndownService.turndown(richTextHtml) : body
      ).trim();

      const title = frontmatter.title.trim();
      const slug = frontmatter.slug.trim();

      if (!title || !slug) {
        addToast("Title and slug are required", "error");
        setIsSaving(false);
        return;
      }

      if (!SLUG_PATTERN.test(slug)) {
        addToast("Slug must use lowercase letters, digits, and hyphens only", "error");
        setIsSaving(false);
        return;
      }

      // Check if slug is still default and warn user
      if (DEFAULT_SLUGS.includes(slug)) {
        addToast(
          `Warning: Your slug is still "${slug}". Please change the slug to a unique URL-friendly value before saving.`,
          "warning"
        );
        setIsSaving(false);
        return;
      }

      // Check if title is still default
      if (title === "Your Post Title" || title === "Page Title") {
        addToast(
          `Warning: Please change the title from "${title}" to something unique before saving.`,
          "warning"
        );
        setIsSaving(false);
        return;
      }

      const optionalString = (value: string): string | undefined =>
        value.trim() === "" ? undefined : value.trim();

      if (contentType === "post") {
        const description = frontmatter.description.trim();
        const date =
          frontmatter.date.trim() !== ""
            ? frontmatter.date.trim()
            : new Date().toISOString().split("T")[0];

        if (isDemo) {
          await createDemoPostMutation({
            post: {
              slug,
              title,
              description,
              content: bodyContent,
              date,
              published: frontmatter.published,
              tags: frontmatter.tags,
              readTime: optionalString(frontmatter.readTime),
              image: optionalString(frontmatter.image),
              excerpt: optionalString(frontmatter.excerpt),
              authorName: optionalString(frontmatter.authorName),
            },
          });
        } else {
          await createPostMutation({
            post: {
              slug,
              title,
              description,
              content: bodyContent,
              date,
              published: frontmatter.published,
              tags: frontmatter.tags,
              readTime: optionalString(frontmatter.readTime),
              image: optionalString(frontmatter.image),
              ogImage: optionalString(frontmatter.ogImage),
              noOgImage: frontmatter.noOgImage ? true : undefined,
              excerpt: optionalString(frontmatter.excerpt),
              featured: frontmatter.featured ? true : undefined,
              featuredOrder: frontmatter.featuredOrder,
              authorName: optionalString(frontmatter.authorName),
              authorImage: optionalString(frontmatter.authorImage),
              aiWritten: frontmatter.aiWritten ? true : undefined,
            },
          });
        }
        addToast(`Post "${title}" saved to database. Redirecting to Posts...`, "success");
        // Share on X in the background; a share failure never blocks the save
        if (!isDemo && shareOnX && frontmatter.published && xStatus?.connected) {
          void sharePublishedPost({ title, slug })
            .then((result) => addToast(`Shared on X: ${result.tweetUrl}`, "success"))
            .catch((error) =>
              addToast(
                error instanceof Error ? error.message : "X share failed",
                "error",
              ),
            );
        }
        setTimeout(() => {
          setActiveSection("posts");
        }, 500);
      } else {
        if (isDemo) {
          await createDemoPageMutation({
            page: {
              slug,
              title,
              content: bodyContent,
              published: frontmatter.published,
              excerpt: optionalString(frontmatter.excerpt),
              image: optionalString(frontmatter.image),
              authorName: optionalString(frontmatter.authorName),
            },
          });
        } else {
          await createPageMutation({
            page: {
              slug,
              title,
              content: bodyContent,
              published: frontmatter.published,
              order: frontmatter.order,
              showInNav: frontmatter.showInNav ? true : undefined,
              excerpt: optionalString(frontmatter.excerpt),
              image: optionalString(frontmatter.image),
              ogImage: optionalString(frontmatter.ogImage),
              noOgImage: frontmatter.noOgImage ? true : undefined,
              featured: frontmatter.featured ? true : undefined,
              featuredOrder: frontmatter.featuredOrder,
              authorName: optionalString(frontmatter.authorName),
              authorImage: optionalString(frontmatter.authorImage),
            },
          });
        }
        addToast(`Page "${title}" saved to database. Redirecting to Pages...`, "success");
        setTimeout(() => {
          setActiveSection("pages");
        }, 500);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save";
      addToast(message, "error");
    } finally {
      setIsSaving(false);
    }
  }, [
    frontmatter,
    body,
    editorMode,
    richTextHtml,
    turndownService,
    contentType,
    createPostMutation,
    createPageMutation,
    createDemoPostMutation,
    createDemoPageMutation,
    isDemo,
    shareOnX,
    xStatus,
    sharePublishedPost,
    addToast,
    setActiveSection,
  ]);

  // Calculate stats (markdown body only)
  const lines = body.split("\n").length;
  const characters = body.length;
  const words = body.trim() ? body.trim().split(/\s+/).length : 0;

  // In demo mode, hide frontmatter fields the demo mutations silently drop
  // (featured, ordering, nav placement, author image) so demo users can't
  // enter values that never persist or surface demo content in the navbar.
  const demoHiddenFields: ReadonlyArray<keyof FrontmatterValues> | undefined = isDemo
    ? contentType === "post"
      ? ["featured", "featuredOrder", "authorImage"]
      : ["featured", "featuredOrder", "order", "showInNav", "authorImage"]
    : undefined;

  return (
    <div
      className={`dashboard-write-section ${focusMode ? "focus-mode" : ""} ${frontmatterCollapsed ? "frontmatter-collapsed" : ""}`}>
      {/* Write Actions Header */}
      <div className="dashboard-write-header">
        <div className="dashboard-write-title">
          <span>{contentType === "post" ? "Blog Post" : "Page"}</span>
          <div className="dashboard-seg" role="group" aria-label="Editor mode">
            <button
              className={`dashboard-seg-btn ${editorMode === "markdown" ? "active" : ""}`}
              aria-pressed={editorMode === "markdown"}
              onClick={() => handleModeChange("markdown")}>
              Markdown
            </button>
            <button
              className={`dashboard-seg-btn ${editorMode === "richtext" ? "active" : ""}`}
              aria-pressed={editorMode === "richtext"}
              onClick={() => handleModeChange("richtext")}>
              Rich Text
            </button>
            <button
              className={`dashboard-seg-btn ${editorMode === "preview" ? "active" : ""}`}
              aria-pressed={editorMode === "preview"}
              onClick={() => handleModeChange("preview")}>
              Preview
            </button>
          </div>
        </div>
        <div className="dashboard-write-actions">
          <button onClick={handleClear} className="dashboard-action-btn" title="Clear content">
            <Trash size={16} />
            <span>Clear</span>
          </button>
          <button
            onClick={handleCopy}
            className={`dashboard-action-btn primary ${copied ? "copied" : ""}`}>
            {copied ? <Check size={16} weight="bold" /> : <CopySimple size={16} />}
            <span>{copied ? "Copied" : "Copy All"}</span>
          </button>
          {siteConfig.media?.enabled && !isDemo && (
            <button
              onClick={() => setShowImageUpload(true)}
              className="dashboard-action-btn"
              title="Insert Image">
              <Image size={16} />
              <span>Image</span>
            </button>
          )}
          <button
            onClick={handleDownloadMarkdown}
            className="dashboard-action-btn primary"
            title="Download Markdown">
            <Download size={16} />
            <span>Download .md</span>
          </button>
          {contentType === "post" && !isDemo && xStatus?.connected && (
            <label
              className="write-share-x-toggle"
              title="Post the title and link to X after publishing">
              <input
                type="checkbox"
                checked={shareOnX}
                onChange={(e) => setShareOnX(e.target.checked)}
              />
              <XLogo size={14} />
              <span>Share on X</span>
            </label>
          )}
          <button
            onClick={handleSaveToDb}
            disabled={isSaving}
            className="dashboard-action-btn success dashboard-save-inline"
            title="Save to Database">
            {isSaving ? (
              <SpinnerGap size={16} className="animate-spin" />
            ) : (
              <FloppyDisk size={16} />
            )}
            <span>{isSaving ? "Saving..." : "Save to DB"}</span>
          </button>
          <button
            onClick={toggleFocusMode}
            className={`dashboard-action-btn focus-toggle ${focusMode ? "active" : ""}`}
            title={focusMode ? "Exit focus mode (Esc)" : "Enter focus mode"}>
            {focusMode ? (
              <ArrowsIn size={16} weight="regular" />
            ) : (
              <ArrowsOut size={16} weight="regular" />
            )}
          </button>
        </div>
      </div>

      <div className="dashboard-write-container">
        {/* Main Writing Area */}
        <div className="dashboard-write-main">
          <BodyCard open={bodyOpen} onToggle={toggleBody} content={body} showMeta={false}>
            {editorMode === "markdown" && (
              <textarea
                ref={textareaRef}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="dashboard-write-textarea"
                placeholder="Start writing your markdown body (frontmatter is managed in the form)..."
                spellCheck={true}
              />
            )}

            {editorMode === "richtext" && (
            <div className="dashboard-quill-container">
              <div className="ql-toolbar dashboard-simple-toolbar">
                <button
                  type="button"
                  className="dashboard-rich-btn"
                  onClick={() => applyRichTextCommand("bold")}
                  title="Bold">
                  B
                </button>
                <button
                  type="button"
                  className="dashboard-rich-btn"
                  onClick={() => applyRichTextCommand("italic")}
                  title="Italic">
                  I
                </button>
                <button
                  type="button"
                  className="dashboard-rich-btn"
                  onClick={() => applyRichTextCommand("strikeThrough")}
                  title="Strike">
                  S
                </button>
                <button
                  type="button"
                  className="dashboard-rich-btn"
                  onClick={() => applyRichTextCommand("formatBlock", "H2")}
                  title="Heading 2">
                  H2
                </button>
                <button
                  type="button"
                  className="dashboard-rich-btn"
                  onClick={() => applyRichTextCommand("formatBlock", "H3")}
                  title="Heading 3">
                  H3
                </button>
                <button
                  type="button"
                  className="dashboard-rich-btn"
                  onClick={() => applyRichTextCommand("insertUnorderedList")}
                  title="Bullet list">
                  List
                </button>
                <button
                  type="button"
                  className="dashboard-rich-btn"
                  onClick={() => applyRichTextCommand("insertOrderedList")}
                  title="Numbered list">
                  1.
                </button>
                <button
                  type="button"
                  className="dashboard-rich-btn"
                  onClick={() => applyRichTextCommand("formatBlock", "BLOCKQUOTE")}
                  title="Quote">
                  Quote
                </button>
              </div>
              <div className="ql-container">
                <div
                  ref={richTextRef}
                  className={`ql-editor ${richTextHtml.replace(/<[^>]*>/g, "").trim() ? "" : "ql-blank"}`}
                  contentEditable
                  suppressContentEditableWarning
                  data-placeholder="Start writing..."
                  onInput={handleRichTextInput}
                  dangerouslySetInnerHTML={{ __html: richTextHtml }}
                />
              </div>
            </div>
          )}

            {editorMode === "preview" && (
              <div className="dashboard-preview">
                <div className="dashboard-preview-content">
                  <div className="blog-post-content">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm, remarkBreaks]}
                      rehypePlugins={[rehypeRaw, [rehypeSanitize, defaultSchema]]}>
                      {body}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            )}
          </BodyCard>

          <div className="dashboard-write-footer">
            <div className="dashboard-write-stats">
              <span>{words} words</span>
              <span className="stats-divider" />
              <span>{lines} lines</span>
              <span className="stats-divider" />
              <span>{characters} chars</span>
            </div>
            <div className="dashboard-write-hint">
              {editorMode === "richtext" ? (
                "Editing body content only (frontmatter preserved)"
              ) : (
                <>
                  Save to <code>content/{contentType === "post" ? "blog" : "pages"}/</code> then{" "}
                  <code>npm run sync</code>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Frontmatter Sidebar */}
        <aside className={`dashboard-write-sidebar ${frontmatterCollapsed ? "collapsed" : ""}`}>
          <button
            type="button"
            className="dashboard-write-sidebar-header"
            onClick={toggleFrontmatter}
            aria-expanded={!frontmatterCollapsed}
            title={frontmatterCollapsed ? "Expand frontmatter" : "Collapse frontmatter"}>
            <span>Frontmatter</span>
            <SidebarSimple
              size={16}
              weight="regular"
              className="dashboard-write-sidebar-toggle-icon"
            />
          </button>
          <div className="dashboard-write-fields fmf-panel">
            <FrontmatterForm
              kind={contentType}
              value={frontmatter}
              onChange={setFrontmatter}
              hiddenFields={demoHiddenFields}
              onRequestImage={
                siteConfig.media?.enabled && !isDemo
                  ? (field) => setFmImageField(field)
                  : undefined
              }
            />
          </div>
        </aside>
      </div>

      {/* Mobile-only sticky save bar so Save is never scrolled away */}
      <div className="dashboard-editor-savebar">
        <button
          onClick={handleSaveToDb}
          disabled={isSaving}
          className="dashboard-action-btn success"
          title="Save to Database">
          {isSaving ? <SpinnerGap size={16} className="animate-spin" /> : <FloppyDisk size={16} />}
          <span>{isSaving ? "Saving..." : "Save to DB"}</span>
        </button>
      </div>

      {/* Local storage warning */}
      <div className="dashboard-write-warning">
        <Warning size={14} />
        <span>
          Content saved locally in this browser only. Copy before leaving to avoid losing work.
        </span>
      </div>

      {/* Image Upload Modal - only when media is enabled and not in demo mode */}
      {siteConfig.media?.enabled && !isDemo && (
        <ImageUploadModal
          isOpen={showImageUpload}
          onClose={() => setShowImageUpload(false)}
          onInsert={handleInsertImage}
        />
      )}

      {/* Frontmatter image picker (returns URL only) */}
      {siteConfig.media?.enabled && !isDemo && fmImageField !== null && (
        <ImageUploadModal
          isOpen={fmImageField !== null}
          onClose={() => setFmImageField(null)}
          onSelectUrl={(url) => {
            setFrontmatter({ ...frontmatter, [fmImageField]: url });
            setFmImageField(null);
          }}
        />
      )}
    </div>
  );
}

function AIAgentSection() {
  const [activeTab, setActiveTab] = useState<"chat" | "image">("chat");
  const [selectedTextModel, setSelectedTextModel] = useState(
    siteConfig.aiDashboard?.defaultTextModel || "claude-sonnet-4-20250514"
  );
  const [selectedImageModel, setSelectedImageModel] = useState(
    siteConfig.aiDashboard?.imageModels?.[0]?.id || "gemini-2.0-flash-exp-image-generation"
  );
  const [aspectRatio, setAspectRatio] = useState<"1:1" | "16:9" | "9:16" | "4:3" | "3:4">("1:1");
  const [imagePrompt, setImagePrompt] = useState("");
  const [isRequestingImage, setIsRequestingImage] = useState(false);
  const [currentImageJobId, setCurrentImageJobId] = useState<Id<"aiImageGenerationJobs"> | null>(
    null
  );
  const [imageRequestError, setImageRequestError] = useState<string | null>(null);
  const [showImageModelDropdown, setShowImageModelDropdown] = useState(false);
  const [showTextModelDropdown, setShowTextModelDropdown] = useState(false);
  const [copiedFormat, setCopiedFormat] = useState<"md" | "html" | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeletingImage, setIsDeletingImage] = useState(false);

  const requestImageGeneration = useMutation(api.aiImageJobs.requestImageGeneration);
  const imageGenerationJob = useQuery(
    api.aiImageJobs.getImageGenerationJob,
    currentImageJobId ? { jobId: currentImageJobId } : "skip"
  );
  const deleteGeneratedImage = useMutation(api.aiChats.deleteGeneratedImage);

  const textModels = siteConfig.aiDashboard?.textModels || [
    { id: "claude-sonnet-4-20250514", name: "Claude Sonnet 4", provider: "anthropic" as const },
  ];
  const imageModels = siteConfig.aiDashboard?.imageModels || [
    {
      id: "gemini-2.0-flash-exp-image-generation",
      name: "Nano Banana",
      provider: "google" as const,
    },
  ];

  const enableImageGeneration = siteConfig.aiDashboard?.enableImageGeneration ?? true;
  const generatedImage =
    imageGenerationJob &&
    imageGenerationJob.status === "completed" &&
    imageGenerationJob.url &&
    imageGenerationJob.storageId
      ? {
          url: imageGenerationJob.url,
          prompt: imageGenerationJob.prompt,
          storageId: imageGenerationJob.storageId,
        }
      : null;
  const imageError =
    imageRequestError ||
    (imageGenerationJob?.status === "failed"
      ? imageGenerationJob.error || "Failed to generate image"
      : null);
  const isGeneratingImage = isRequestingImage || imageGenerationJob?.status === "pending";

  const handleGenerateImage = async () => {
    if (!imagePrompt.trim() || isGeneratingImage) return;

    setIsRequestingImage(true);
    setImageRequestError(null);
    setCurrentImageJobId(null);

    try {
      const result = await requestImageGeneration({
        sessionId: localStorage.getItem("ai_chat_session_id") || crypto.randomUUID(),
        prompt: imagePrompt,
        model: selectedImageModel as
          | "gemini-2.0-flash-exp-image-generation"
          | "imagen-3.0-generate-002",
        aspectRatio,
      });
      setCurrentImageJobId(result.jobId);
    } catch (error) {
      setImageRequestError(error instanceof Error ? error.message : "Failed to generate image");
    } finally {
      setIsRequestingImage(false);
    }
  };

  // Handle delete image from database
  const handleDeleteImage = async () => {
    if (!generatedImage) return;

    setIsDeletingImage(true);
    try {
      await deleteGeneratedImage({ storageId: generatedImage.storageId });
      setCurrentImageJobId(null);
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error("Failed to delete image:", error);
    } finally {
      setIsDeletingImage(false);
    }
  };

  const selectedTextModelName =
    textModels.find((m) => m.id === selectedTextModel)?.name || "Claude Sonnet 4";
  const selectedImageModelName =
    imageModels.find((m) => m.id === selectedImageModel)?.name || "Nano Banana";

  // Generate markdown code for the image
  const getMarkdownCode = (url: string, prompt: string) => `![${prompt}](${url})`;

  // Generate HTML code for the image
  const getHtmlCode = (url: string, prompt: string) => `<img src="${url}" alt="${prompt}" />`;

  // Copy code to clipboard
  const handleCopyCode = async (format: "md" | "html") => {
    if (!generatedImage) return;
    const code =
      format === "md"
        ? getMarkdownCode(generatedImage.url, generatedImage.prompt)
        : getHtmlCode(generatedImage.url, generatedImage.prompt);
    await navigator.clipboard.writeText(code);
    setCopiedFormat(format);
    setTimeout(() => setCopiedFormat(null), 2000);
  };

  // Download image to computer
  const handleDownloadImage = async () => {
    if (!generatedImage) return;
    try {
      const response = await fetch(generatedImage.url);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      // Generate filename from prompt (sanitize and truncate)
      const filename = generatedImage.prompt
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .slice(0, 50)
        .replace(/-+$/, "");
      a.download = `${filename || "generated-image"}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download image:", error);
    }
  };

  return (
    <div className="dashboard-ai-section">
      {/* Tabs */}
      <div className="ai-agent-tabs">
        <button
          className={`ai-agent-tab ${activeTab === "chat" ? "active" : ""}`}
          onClick={() => setActiveTab("chat")}>
          <ChatText size={18} weight="bold" />
          <span>Chat</span>
        </button>
        {enableImageGeneration && (
          <button
            className={`ai-agent-tab ${activeTab === "image" ? "active" : ""}`}
            onClick={() => setActiveTab("image")}>
            <Image size={18} weight="bold" />
            <span>Image</span>
          </button>
        )}
      </div>

      {/* Chat Tab */}
      {activeTab === "chat" && (
        <div className="ai-agent-chat-container">
          {/* Model Selector */}
          <div className="ai-model-selector">
            <span className="ai-model-label">Model:</span>
            <div className="ai-model-dropdown-container">
              <button
                className="ai-model-dropdown-trigger"
                onClick={() => setShowTextModelDropdown(!showTextModelDropdown)}>
                <span>{selectedTextModelName}</span>
                <CaretDown size={14} weight="bold" />
              </button>
              {showTextModelDropdown && (
                <div className="ai-model-dropdown">
                  {textModels.map((model) => (
                    <button
                      key={model.id}
                      className={`ai-model-option ${selectedTextModel === model.id ? "selected" : ""}`}
                      onClick={() => {
                        setSelectedTextModel(model.id);
                        setShowTextModelDropdown(false);
                      }}>
                      <span className="ai-model-name">{model.name}</span>
                      <span className="ai-model-provider">{model.provider}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <AIChatView contextId="dashboard-agent" selectedModel={selectedTextModel} />
        </div>
      )}

      {/* Image Generation Tab */}
      {activeTab === "image" && enableImageGeneration && (
        <div className="ai-agent-image-container">
          {/* Image Model Selector */}
          <div className="ai-model-selector">
            <span className="ai-model-label">Model:</span>
            <div className="ai-model-dropdown-container">
              <button
                className="ai-model-dropdown-trigger"
                onClick={() => setShowImageModelDropdown(!showImageModelDropdown)}>
                <span>{selectedImageModelName}</span>
                <CaretDown size={14} weight="bold" />
              </button>
              {showImageModelDropdown && (
                <div className="ai-model-dropdown">
                  {imageModels.map((model) => (
                    <button
                      key={model.id}
                      className={`ai-model-option ${selectedImageModel === model.id ? "selected" : ""}`}
                      onClick={() => {
                        setSelectedImageModel(model.id);
                        setShowImageModelDropdown(false);
                      }}>
                      <span className="ai-model-name">{model.name}</span>
                      <span className="ai-model-provider">{model.provider}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Aspect Ratio Selector */}
          <div className="ai-aspect-ratio-selector">
            <span className="ai-model-label">Aspect:</span>
            <div className="ai-aspect-ratio-options">
              {(["1:1", "16:9", "9:16", "4:3", "3:4"] as const).map((ratio) => (
                <button
                  key={ratio}
                  className={`ai-aspect-ratio-option ${aspectRatio === ratio ? "selected" : ""}`}
                  onClick={() => setAspectRatio(ratio)}>
                  {ratio}
                </button>
              ))}
            </div>
          </div>

          {/* Generated Image Display */}
          {generatedImage && (
            <div className="ai-generated-image">
              <img src={generatedImage.url} alt={generatedImage.prompt} />
              <p className="ai-generated-image-prompt">{generatedImage.prompt}</p>

              {/* Image Actions */}
              <div className="ai-image-actions">
                <button
                  className="ai-image-action-btn download"
                  onClick={handleDownloadImage}
                  title="Download image">
                  <Download size={16} />
                  <span>Download</span>
                </button>
                <button
                  className={`ai-image-action-btn ${copiedFormat === "md" ? "copied" : ""}`}
                  onClick={() => handleCopyCode("md")}
                  title="Copy as Markdown">
                  {copiedFormat === "md" ? <Check size={16} /> : <CopySimple size={16} />}
                  <span>{copiedFormat === "md" ? "Copied" : "MD"}</span>
                </button>
                <button
                  className={`ai-image-action-btn ${copiedFormat === "html" ? "copied" : ""}`}
                  onClick={() => handleCopyCode("html")}
                  title="Copy as HTML">
                  {copiedFormat === "html" ? <Check size={16} /> : <CopySimple size={16} />}
                  <span>{copiedFormat === "html" ? "Copied" : "HTML"}</span>
                </button>
                <button
                  className="ai-image-action-btn delete"
                  onClick={() => setShowDeleteConfirm(true)}
                  title="Delete image from database">
                  <Trash size={16} />
                  <span>Delete</span>
                </button>
              </div>

              {/* Delete Confirmation */}
              {showDeleteConfirm && (
                <div className="ai-image-delete-confirm">
                  <p>Delete this image from the database?</p>
                  <div className="ai-image-delete-actions">
                    <button
                      className="ai-image-confirm-btn cancel"
                      onClick={() => setShowDeleteConfirm(false)}
                      disabled={isDeletingImage}>
                      Cancel
                    </button>
                    <button
                      className="ai-image-confirm-btn confirm"
                      onClick={handleDeleteImage}
                      disabled={isDeletingImage}>
                      {isDeletingImage ? (
                        <>
                          <SpinnerGap size={14} className="animate-spin" />
                          <span>Deleting...</span>
                        </>
                      ) : (
                        <>
                          <Trash size={14} />
                          <span>Delete</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Code Preview */}
              <div className="ai-image-code-preview">
                <div className="ai-image-code-block">
                  <span className="ai-image-code-label">Markdown:</span>
                  <code>{getMarkdownCode(generatedImage.url, generatedImage.prompt)}</code>
                </div>
                <div className="ai-image-code-block">
                  <span className="ai-image-code-label">HTML:</span>
                  <code>{getHtmlCode(generatedImage.url, generatedImage.prompt)}</code>
                </div>
              </div>
            </div>
          )}

          {/* Error Display */}
          {imageError && (
            <div className="ai-image-error">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{imageError}</ReactMarkdown>
            </div>
          )}

          {/* Loading State */}
          {isGeneratingImage && (
            <div className="ai-image-loading">
              <SpinnerGap size={32} weight="bold" className="ai-image-spinner" />
              <span>Generating image...</span>
            </div>
          )}

          {/* Prompt Input */}
          <div className="ai-image-input-container">
            <textarea
              className="ai-image-input"
              value={imagePrompt}
              onChange={(e) => setImagePrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleGenerateImage();
                }
              }}
              placeholder="Describe the image you want to generate..."
              rows={3}
              disabled={isGeneratingImage}
            />
            <button
              className="ai-image-generate-button"
              onClick={handleGenerateImage}
              disabled={!imagePrompt.trim() || isGeneratingImage}>
              {isGeneratingImage ? (
                <SpinnerGap size={18} weight="bold" className="ai-image-spinner" />
              ) : (
                <Image size={18} weight="bold" />
              )}
              <span>Generate</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function NewsletterSubscribersSection() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "subscribed" | "unsubscribed">("all");
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const subscribersData = useQuery(api.newsletter.getAllSubscribers, {
    limit: 20,
    cursor,
    filter,
    search: search || undefined,
  });
  const stats = useQuery(api.newsletter.getNewsletterStats);
  const deleteSubscriber = useMutation(api.newsletter.deleteSubscriber);

  const handleDelete = useCallback(
    async (subscriberId: Id<"newsletterSubscribers">) => {
      const result = await deleteSubscriber({ subscriberId });
      if (result.success) {
        setDeleteConfirm(null);
      }
    },
    [deleteSubscriber]
  );

  const handleNextPage = useCallback(() => {
    if (subscribersData?.nextCursor) {
      setCursor(subscribersData.nextCursor);
    }
  }, [subscribersData?.nextCursor]);

  const handlePrevPage = useCallback(() => {
    setCursor(undefined);
  }, []);

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (!siteConfig.newsletter?.enabled) {
    return (
      <div className="dashboard-section-placeholder">
        <Envelope size={48} weight="light" />
        <h2>Newsletter Disabled</h2>
        <p>Enable newsletter in siteConfig.ts to manage subscribers</p>
      </div>
    );
  }

  return (
    <div className="dashboard-newsletter-section full-width">
      <div className="dashboard-newsletter-stats">
        <div className="newsletter-stat-card">
          <span className="stat-value">{stats?.totalSubscribers ?? 0}</span>
          <span className="stat-label">Total</span>
        </div>
        <div className="newsletter-stat-card">
          <span className="stat-value">{stats?.activeSubscribers ?? 0}</span>
          <span className="stat-label">Active</span>
        </div>
        <div className="newsletter-stat-card">
          <span className="stat-value">{stats?.unsubscribedCount ?? 0}</span>
          <span className="stat-label">Unsubscribed</span>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="dashboard-newsletter-controls">
        <div className="dashboard-newsletter-search">
          <MagnifyingGlass size={16} />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCursor(undefined);
            }}
            placeholder="Search subscribers..."
            className="dashboard-newsletter-search-input"
          />
        </div>
        <div className="dashboard-newsletter-filter-bar">
          <Funnel size={16} />
          <span className="dashboard-newsletter-filter-label">
            {subscribersData?.totalCount ?? 0} results
          </span>
          <div className="dashboard-newsletter-filter-buttons">
            <button
              onClick={() => {
                setFilter("all");
                setCursor(undefined);
              }}
              className={`dashboard-newsletter-filter-btn ${filter === "all" ? "active" : ""}`}>
              All
            </button>
            <button
              onClick={() => {
                setFilter("subscribed");
                setCursor(undefined);
              }}
              className={`dashboard-newsletter-filter-btn ${filter === "subscribed" ? "active" : ""}`}>
              Active
            </button>
            <button
              onClick={() => {
                setFilter("unsubscribed");
                setCursor(undefined);
              }}
              className={`dashboard-newsletter-filter-btn ${filter === "unsubscribed" ? "active" : ""}`}>
              Unsubscribed
            </button>
          </div>
        </div>
      </div>

      {/* Subscriber List */}
      <div className="dashboard-list-table">
        <div className="dashboard-list-table-header">
          <span className="col-email">Email</span>
          <span className="col-status">Status</span>
          <span className="col-source">Source</span>
          <span className="col-date">Subscribed</span>
          <span className="col-actions">Actions</span>
        </div>

        {!subscribersData ? (
          <div className="dashboard-list-empty">Loading subscribers...</div>
        ) : subscribersData.subscribers.length === 0 ? (
          <div className="dashboard-list-empty">
            {search ? "No subscribers match your search." : "No subscribers yet."}
          </div>
        ) : (
          subscribersData.subscribers.map((sub) => (
            <div
              key={sub._id}
              className={`dashboard-list-row ${!sub.subscribed ? "unsubscribed" : ""}`}>
              <div className="col-email">{sub.email}</div>
              <div className="col-status">
                <span className={`status-badge ${!sub.subscribed ? "draft" : "published"}`}>
                  {!sub.subscribed ? "Unsubscribed" : "Active"}
                </span>
              </div>
              <div className="col-source">via {sub.source}</div>
              <div className="col-date">{formatDate(sub.subscribedAt)}</div>
              <div className="col-actions">
                {deleteConfirm === sub._id ? (
                  <div className="dashboard-newsletter-delete-confirm">
                    <span>Delete?</span>
                    <button
                      onClick={() => handleDelete(sub._id)}
                      className="dashboard-action-btn delete"
                      title="Confirm delete">
                      <Check size={16} weight="bold" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className="dashboard-action-btn"
                      title="Cancel">
                      <X size={16} weight="bold" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setDeleteConfirm(sub._id)}
                    className="dashboard-action-btn delete"
                    title="Delete subscriber">
                    <Trash size={16} />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {subscribersData && subscribersData.subscribers.length > 0 && (
        <div className="dashboard-newsletter-pagination">
          <button onClick={handlePrevPage} disabled={!cursor} className="dashboard-action-btn">
            <CaretLeft size={16} />
            First
          </button>
          <button
            onClick={handleNextPage}
            disabled={!subscribersData.nextCursor}
            className="dashboard-action-btn">
            Next
            <CaretRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

type RecipientMode = "all" | "selected";

// Shared recipient picker for the newsletter send sections: all subscribers
// or a searchable checkbox list to target one, two, or any selected set.
function NewsletterRecipientPicker({
  mode,
  onModeChange,
  selectedEmails,
  onSelectedChange,
  disabled,
}: {
  mode: RecipientMode;
  onModeChange: (mode: RecipientMode) => void;
  selectedEmails: Array<string>;
  onSelectedChange: (emails: Array<string>) => void;
  disabled: boolean;
}) {
  const [search, setSearch] = useState("");
  const subscribersData = useQuery(
    api.newsletter.getAllSubscribers,
    mode === "selected"
      ? { filter: "subscribed", search: search.trim() || undefined, limit: 100 }
      : "skip",
  );

  const toggleEmail = (email: string) => {
    if (selectedEmails.includes(email)) {
      onSelectedChange(selectedEmails.filter((e) => e !== email));
    } else {
      onSelectedChange([...selectedEmails, email]);
    }
  };

  return (
    <div className="dashboard-newsletter-form-group">
      <label className="dashboard-newsletter-label">Recipients</label>
      <div className="dashboard-newsletter-recipient-toggle">
        <button
          type="button"
          className={mode === "all" ? "active" : ""}
          onClick={() => onModeChange("all")}
          disabled={disabled}>
          All subscribers
        </button>
        <button
          type="button"
          className={mode === "selected" ? "active" : ""}
          onClick={() => onModeChange("selected")}
          disabled={disabled}>
          Select recipients
        </button>
      </div>

      {mode === "selected" && (
        <div className="dashboard-newsletter-recipient-picker">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search subscribers by email..."
            className="dashboard-newsletter-input"
            disabled={disabled}
          />
          <div className="dashboard-newsletter-recipient-list">
            {subscribersData === undefined ? (
              <span className="dashboard-newsletter-recipient-empty">
                Loading subscribers...
              </span>
            ) : subscribersData.subscribers.length === 0 ? (
              <span className="dashboard-newsletter-recipient-empty">
                No subscribers found
              </span>
            ) : (
              subscribersData.subscribers.map((sub) => (
                <label key={sub._id} className="dashboard-newsletter-recipient-item">
                  <input
                    type="checkbox"
                    checked={selectedEmails.includes(sub.email)}
                    onChange={() => toggleEmail(sub.email)}
                    disabled={disabled}
                  />
                  <span>{sub.email}</span>
                </label>
              ))
            )}
          </div>
          <div className="dashboard-newsletter-recipient-footer">
            <span>
              {selectedEmails.length} selected
            </span>
            {selectedEmails.length > 0 && (
              <button
                type="button"
                onClick={() => onSelectedChange([])}
                disabled={disabled}
                className="dashboard-newsletter-recipient-clear">
                Clear
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function NewsletterSendSection({
  addToast,
}: {
  addToast: (message: string, type: ToastType) => void;
}) {
  const posts = useQuery(api.newsletter.getPostsForNewsletter);
  const [selectedPost, setSelectedPost] = useState("");
  const [recipientMode, setRecipientMode] = useState<RecipientMode>("all");
  const [selectedEmails, setSelectedEmails] = useState<Array<string>>([]);
  const [sendingNewsletter, setSendingNewsletter] = useState(false);
  const [sendResult, setSendResult] = useState<{
    success: boolean;
    message: string;
    command?: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const scheduleSendPost = useMutation(api.newsletter.scheduleSendPostNewsletter);

  const handleSendPostNewsletter = useCallback(async () => {
    if (!selectedPost) return;

    setSendingNewsletter(true);
    setSendResult(null);
    setCopied(false);

    try {
      const result = await scheduleSendPost({
        postSlug: selectedPost,
        siteUrl: window.location.origin,
        siteName: siteConfig.name,
        recipientEmails:
          recipientMode === "selected" ? selectedEmails : undefined,
      });

      const command = `npm run newsletter:send ${selectedPost}`;
      setSendResult({
        success: result.success,
        message: result.message,
        command: result.success && recipientMode === "all" ? command : undefined,
      });

      if (result.success) {
        addToast("Newsletter is being sent", "success");
      } else {
        addToast(result.message, "error");
      }
    } catch (error) {
      const message = "Failed to send newsletter. Check console for details.";
      setSendResult({
        success: false,
        message,
      });
      addToast(message, "error");
    } finally {
      setSendingNewsletter(false);
    }
  }, [selectedPost, recipientMode, selectedEmails, scheduleSendPost, addToast]);

  const handleCopyCommand = useCallback(async (command: string) => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = command;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, []);

  if (!siteConfig.newsletter?.enabled) {
    return (
      <div className="dashboard-section-placeholder">
        <Envelope size={48} weight="light" />
        <h2>Newsletter Disabled</h2>
        <p>Enable newsletter in siteConfig.ts to send newsletters</p>
      </div>
    );
  }

  return (
    <div className="dashboard-newsletter-section full-width">
      <div className="dashboard-newsletter-send">
        <h3>Send Post as Newsletter</h3>
        <p className="dashboard-newsletter-form-desc">
          Select a blog post to send to all active subscribers or a chosen few.
          Sending to selected people does not mark the post as sent.
        </p>

        <div className="dashboard-newsletter-form-group">
          <label className="dashboard-newsletter-label">Select Post</label>
          <select
            value={selectedPost}
            onChange={(e) => setSelectedPost(e.target.value)}
            className="dashboard-newsletter-select"
            disabled={sendingNewsletter}>
            <option value="">Choose a post...</option>
            {posts?.map((post) => (
              <option
                key={post.slug}
                value={post.slug}
                disabled={post.wasSent && recipientMode === "all"}>
                {post.title} ({post.date}){post.wasSent ? " - SENT" : ""}
              </option>
            ))}
          </select>
        </div>

        <NewsletterRecipientPicker
          mode={recipientMode}
          onModeChange={setRecipientMode}
          selectedEmails={selectedEmails}
          onSelectedChange={setSelectedEmails}
          disabled={sendingNewsletter}
        />

        <button
          onClick={handleSendPostNewsletter}
          disabled={
            !selectedPost ||
            sendingNewsletter ||
            (recipientMode === "selected" && selectedEmails.length === 0)
          }
          className="dashboard-newsletter-send-btn">
          {sendingNewsletter ? (
            "Sending..."
          ) : (
            <>
              <PaperPlaneTilt size={16} />
              {recipientMode === "selected"
                ? `Send to ${selectedEmails.length} selected`
                : "Send to Subscribers"}
            </>
          )}
        </button>

        {sendResult && (
          <div
            className={`dashboard-newsletter-result ${sendResult.success ? "success" : "error"}`}>
            <span>{sendResult.message}</span>
            {sendResult.command && (
              <div className="dashboard-newsletter-command-row">
                <code className="dashboard-newsletter-command">{sendResult.command}</code>
                <button
                  onClick={() => handleCopyCommand(sendResult.command!)}
                  className="dashboard-action-btn"
                  title={copied ? "Copied!" : "Copy command"}>
                  {copied ? <Check size={14} weight="bold" /> : <Copy size={14} />}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function NewsletterWriteEmailSection({
  addToast,
}: {
  addToast: (message: string, type: ToastType) => void;
}) {
  const [customSubject, setCustomSubject] = useState("");
  const [customContent, setCustomContent] = useState("");
  const [recipientMode, setRecipientMode] = useState<RecipientMode>("all");
  const [selectedEmails, setSelectedEmails] = useState<Array<string>>([]);
  const [sendingNewsletter, setSendingNewsletter] = useState(false);
  const [sendResult, setSendResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const scheduleSendCustom = useMutation(api.newsletter.scheduleSendCustomNewsletter);

  const handleSendCustomNewsletter = useCallback(async () => {
    if (!customSubject.trim() || !customContent.trim()) {
      addToast("Subject and content are required", "error");
      return;
    }

    setSendingNewsletter(true);
    setSendResult(null);

    try {
      const result = await scheduleSendCustom({
        subject: customSubject,
        content: customContent,
        siteUrl: window.location.origin,
        siteName: siteConfig.name,
        recipientEmails:
          recipientMode === "selected" ? selectedEmails : undefined,
      });

      setSendResult({
        success: result.success,
        message: result.message,
      });

      if (result.success) {
        addToast("Newsletter is being sent", "success");
        // Clear form on success
        setCustomSubject("");
        setCustomContent("");
      } else {
        addToast(result.message, "error");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to send newsletter";
      setSendResult({
        success: false,
        message: errorMessage,
      });
      addToast(errorMessage, "error");
    } finally {
      setSendingNewsletter(false);
    }
  }, [
    customSubject,
    customContent,
    recipientMode,
    selectedEmails,
    scheduleSendCustom,
    addToast,
  ]);

  if (!siteConfig.newsletter?.enabled) {
    return (
      <div className="dashboard-section-placeholder">
        <Envelope size={48} weight="light" />
        <h2>Newsletter Disabled</h2>
        <p>Enable newsletter in siteConfig.ts to send newsletters</p>
      </div>
    );
  }

  return (
    <div className="dashboard-newsletter-section full-width">
      <div className="dashboard-newsletter-write">
        <h3>Write Custom Email</h3>
        <p className="dashboard-newsletter-form-desc">
          Write a custom email for all active subscribers or a chosen few.
          Supports markdown formatting.
        </p>

        <div className="dashboard-newsletter-form-group">
          <label className="dashboard-newsletter-label">Subject</label>
          <input
            type="text"
            value={customSubject}
            onChange={(e) => setCustomSubject(e.target.value)}
            placeholder="Email subject line..."
            className="dashboard-newsletter-input"
            disabled={sendingNewsletter}
          />
        </div>

        <div className="dashboard-newsletter-form-group">
          <label className="dashboard-newsletter-label">Content (Markdown)</label>
          <textarea
            value={customContent}
            onChange={(e) => setCustomContent(e.target.value)}
            placeholder={`Write your email content here...

Supports markdown:
# Heading
**bold** and *italic*
[link text](url)
- list items`}
            className="dashboard-newsletter-textarea"
            rows={12}
            disabled={sendingNewsletter}
          />
        </div>

        <NewsletterRecipientPicker
          mode={recipientMode}
          onModeChange={setRecipientMode}
          selectedEmails={selectedEmails}
          onSelectedChange={setSelectedEmails}
          disabled={sendingNewsletter}
        />

        <button
          onClick={handleSendCustomNewsletter}
          disabled={
            !customSubject.trim() ||
            !customContent.trim() ||
            sendingNewsletter ||
            (recipientMode === "selected" && selectedEmails.length === 0)
          }
          className="dashboard-newsletter-send-btn">
          {sendingNewsletter ? (
            "Sending..."
          ) : (
            <>
              <PaperPlaneTilt size={16} />
              {recipientMode === "selected"
                ? `Send to ${selectedEmails.length} selected`
                : "Send to Subscribers"}
            </>
          )}
        </button>

        {sendResult && (
          <div
            className={`dashboard-newsletter-result ${sendResult.success ? "success" : "error"}`}>
            <span>{sendResult.message}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function NewsletterRecentSendsSection() {
  const stats = useQuery(api.newsletter.getNewsletterStats);

  const formatDateTime = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!siteConfig.newsletter?.enabled) {
    return (
      <div className="dashboard-section-placeholder">
        <ClockCounterClockwise size={48} weight="light" />
        <h2>Newsletter Disabled</h2>
        <p>Enable newsletter in siteConfig.ts to view recent sends</p>
      </div>
    );
  }

  return (
    <div className="dashboard-newsletter-section full-width">
      {!stats ? (
        <div className="dashboard-list-empty">Loading recent sends...</div>
      ) : stats.recentNewsletters.length === 0 ? (
        <div className="dashboard-list-empty">No newsletters sent yet.</div>
      ) : (
        <div className="dashboard-newsletter-recent-list">
          {stats.recentNewsletters.map((newsletter, index) => (
            <div
              key={`${newsletter.postSlug}-${index}`}
              className="dashboard-newsletter-recent-item">
              <div className="dashboard-newsletter-recent-info">
                <span className="dashboard-newsletter-recent-slug">
                  {newsletter.type === "custom"
                    ? newsletter.subject || "Custom Email"
                    : newsletter.postSlug}
                </span>
                <span className="dashboard-newsletter-recent-meta">
                  {newsletter.type === "custom" ? (
                    <span className="dashboard-newsletter-badge-type custom">Custom</span>
                  ) : (
                    <span className="dashboard-newsletter-badge-type post">Post</span>
                  )}
                  Sent to {newsletter.sentCount} subscriber
                  {newsletter.sentCount !== 1 ? "s" : ""}
                </span>
              </div>
              <span className="dashboard-newsletter-recent-date">
                {formatDateTime(newsletter.sentAt)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function NewsletterStatsSection() {
  const stats = useQuery(api.newsletter.getNewsletterStats);

  if (!siteConfig.newsletter?.enabled) {
    return (
      <div className="dashboard-section-placeholder">
        <ChartLine size={48} weight="light" />
        <h2>Newsletter Disabled</h2>
        <p>Enable newsletter in siteConfig.ts to view stats</p>
      </div>
    );
  }

  return (
    <div className="dashboard-newsletter-section full-width">
      {!stats ? (
        <div className="dashboard-list-empty">Loading stats...</div>
      ) : (
        <>
          {/* Stats cards */}
          <div className="dashboard-newsletter-stats-cards">
            <div className="dashboard-newsletter-stat-card">
              <div className="dashboard-newsletter-stat-card-icon">
                <PaperPlaneTilt size={24} />
              </div>
              <div className="dashboard-newsletter-stat-card-content">
                <span className="dashboard-newsletter-stat-card-value">
                  {stats.totalEmailsSent}
                </span>
                <span className="dashboard-newsletter-stat-card-label">Total Emails Sent</span>
              </div>
            </div>
            <div className="dashboard-newsletter-stat-card">
              <div className="dashboard-newsletter-stat-card-icon">
                <Envelope size={24} />
              </div>
              <div className="dashboard-newsletter-stat-card-content">
                <span className="dashboard-newsletter-stat-card-value">
                  {stats.totalNewslettersSent}
                </span>
                <span className="dashboard-newsletter-stat-card-label">Newsletters Sent</span>
              </div>
            </div>
            <div className="dashboard-newsletter-stat-card">
              <div className="dashboard-newsletter-stat-card-icon">
                <Users size={24} />
              </div>
              <div className="dashboard-newsletter-stat-card-content">
                <span className="dashboard-newsletter-stat-card-value">
                  {stats.activeSubscribers}
                </span>
                <span className="dashboard-newsletter-stat-card-label">Active Subscribers</span>
              </div>
            </div>
            <div className="dashboard-newsletter-stat-card">
              <div className="dashboard-newsletter-stat-card-icon">
                <TrendUp size={24} />
              </div>
              <div className="dashboard-newsletter-stat-card-content">
                <span className="dashboard-newsletter-stat-card-value">
                  {stats.totalSubscribers > 0
                    ? Math.round((stats.activeSubscribers / stats.totalSubscribers) * 100)
                    : 0}
                  %
                </span>
                <span className="dashboard-newsletter-stat-card-label">Retention Rate</span>
              </div>
            </div>
          </div>

          {/* Stats summary */}
          <div className="dashboard-newsletter-stats-summary">
            <h3>Summary</h3>
            <div className="dashboard-newsletter-stats-row">
              <span>Total Subscribers</span>
              <span>{stats.totalSubscribers}</span>
            </div>
            <div className="dashboard-newsletter-stats-row">
              <span>Active Subscribers</span>
              <span>{stats.activeSubscribers}</span>
            </div>
            <div className="dashboard-newsletter-stats-row">
              <span>Unsubscribed</span>
              <span>{stats.unsubscribedCount}</span>
            </div>
            <div className="dashboard-newsletter-stats-row">
              <span>Newsletters Sent</span>
              <span>{stats.totalNewslettersSent}</span>
            </div>
            <div className="dashboard-newsletter-stats-row">
              <span>Total Emails Sent</span>
              <span>{stats.totalEmailsSent}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function ImportURLSection({ addToast }: { addToast: (message: string, type?: ToastType) => void }) {
  const [url, setUrl] = useState("");
  const [isRequestingImport, setIsRequestingImport] = useState(false);
  const [publishImmediately, setPublishImmediately] = useState(false);
  const [lastImported, setLastImported] = useState<{
    title: string;
    slug: string;
  } | null>(null);
  const [currentImportJobId, setCurrentImportJobId] = useState<Id<"importUrlJobs"> | null>(null);
  const [importRequestError, setImportRequestError] = useState<string | null>(null);
  const [handledImportJobId, setHandledImportJobId] = useState<Id<"importUrlJobs"> | null>(null);
  const requestImportFromUrl = useMutation(api.importJobs.requestImportFromUrl);
  const importJob = useQuery(
    api.importJobs.getImportJob,
    currentImportJobId ? { jobId: currentImportJobId } : "skip"
  );

  const isLoading = isRequestingImport || importJob?.status === "pending";

  useEffect(() => {
    if (!importJob || handledImportJobId === importJob._id) {
      return;
    }

    if (importJob.status === "completed" && importJob.slug && importJob.title) {
      setLastImported({ title: importJob.title, slug: importJob.slug });
      addToast(`Imported "${importJob.title}" successfully`, "success");
      setUrl("");
      setHandledImportJobId(importJob._id);
      return;
    }

    if (importJob.status === "failed") {
      addToast(importJob.error || "Failed to import URL", "error");
      setHandledImportJobId(importJob._id);
    }
  }, [addToast, handledImportJobId, importJob]);

  const handleImport = async () => {
    if (!url.trim()) return;

    setIsRequestingImport(true);
    setLastImported(null);
    setImportRequestError(null);
    setHandledImportJobId(null);
    setCurrentImportJobId(null);

    try {
      const result = await requestImportFromUrl({
        url: url.trim(),
        published: publishImmediately,
      });
      setCurrentImportJobId(result.jobId);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to import URL";
      setImportRequestError(message);
      addToast(message, "error");
    } finally {
      setIsRequestingImport(false);
    }
  };

  return (
    <div className="dashboard-import-section">
      <div className="dashboard-import-header">
        <CloudArrowDown size={32} weight="light" />
        <h2>Import from URL</h2>
        <p>Import articles directly to the database using Firecrawl</p>
      </div>

      <div className="dashboard-import-form">
        <div className="dashboard-import-input-group">
          <LinkIcon size={18} />
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/article"
            className="dashboard-import-input"
            onKeyDown={(e) => {
              if (e.key === "Enter" && url.trim() && !isLoading) {
                handleImport();
              }
            }}
          />
        </div>
        <label className="dashboard-import-checkbox">
          <input
            type="checkbox"
            checked={publishImmediately}
            onChange={(e) => setPublishImmediately(e.target.checked)}
          />
          <span>Publish immediately</span>
        </label>
        <button
          className="dashboard-import-btn"
          onClick={handleImport}
          disabled={isLoading || !url.trim()}>
          {isLoading ? (
            <>
              <SpinnerGap size={16} className="animate-spin" />
              <span>Importing...</span>
            </>
          ) : (
            <>
              <CloudArrowDown size={16} />
              <span>Import to Database</span>
            </>
          )}
        </button>
      </div>

      {lastImported && (
        <div className="dashboard-import-success">
          <CheckCircle size={20} weight="fill" />
          <div>
            <strong>Successfully imported:</strong> {lastImported.title}
            <br />
            <Link to={`/${lastImported.slug}`} className="import-view-link">
              View post →
            </Link>
          </div>
        </div>
      )}

      {importRequestError && !lastImported && (
        <div className="dashboard-import-error">
          <WarningCircle size={20} weight="fill" />
          <div>{importRequestError}</div>
        </div>
      )}

      <div className="dashboard-import-info">
        <h3>How it works</h3>
        <ol>
          <li>Enter the URL of an article you want to import</li>
          <li>Firecrawl scrapes and converts it to markdown</li>
          <li>Post is saved directly to the database</li>
          <li>Edit and publish from the Posts section</li>
        </ol>
        <p className="note">Requires FIRECRAWL_API_KEY in Convex environment variables</p>
      </div>
    </div>
  );
}

// Helper functions for HTML/JSON escaping
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeJson(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\t/g, "\\t");
}

function IndexHtmlSection({ addToast }: { addToast: (message: string, type: ToastType) => void }) {
  // Pre-populate from siteConfig (since index.html should match)
  const [htmlConfig, setHtmlConfig] = useState({
    siteName: siteConfig.name,
    siteTitle: siteConfig.title,
    siteDescription: siteConfig.bio || "",
    siteUrl: import.meta.env.VITE_SITE_URL || "https://example.com",
    siteDomain: import.meta.env.VITE_SITE_URL
      ? new URL(import.meta.env.VITE_SITE_URL).hostname
      : "example.com",
    ogImage: "/images/og-default.png",
    favicon: "/favicon.svg",
    themeColor: "#faf8f5",
    keywords: "markdown site, Convex, Netlify, React, TypeScript, open source, real-time, sync",
    author: siteConfig.name,
  });

  const [copied, setCopied] = useState(false);

  const handleChange = (key: string, value: string) => {
    setHtmlConfig({ ...htmlConfig, [key]: value });
    // Auto-update domain when URL changes
    if (key === "siteUrl" && value) {
      try {
        const url = new URL(value);
        setHtmlConfig((prev) => ({ ...prev, siteDomain: url.hostname }));
      } catch {
        // Invalid URL, ignore
      }
    }
  };

  const generateIndexHtml = () => {
    const ogImageUrl = htmlConfig.ogImage.startsWith("http")
      ? htmlConfig.ogImage
      : `${htmlConfig.siteUrl}${htmlConfig.ogImage}`;

    return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="${htmlConfig.favicon}" />

    <!-- Preconnect for faster API calls -->
    <link rel="preconnect" href="https://convex.cloud" crossorigin />
    <link rel="dns-prefetch" href="https://convex.cloud" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />

    <!-- SEO Meta Tags -->
    <meta
      name="description"
      content="${escapeHtml(htmlConfig.siteDescription)}"
    />
    <meta name="author" content="${escapeHtml(htmlConfig.author)}" />
    <meta
      name="keywords"
      content="${escapeHtml(htmlConfig.keywords)}"
    />
    <meta name="robots" content="index, follow" />

    <!-- Theme -->
    <meta name="theme-color" content="${htmlConfig.themeColor}" />

    <!-- Open Graph -->
    <meta property="og:title" content="${escapeHtml(htmlConfig.siteTitle)}" />
    <meta
      property="og:description"
      content="${escapeHtml(htmlConfig.siteDescription)}"
    />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${htmlConfig.siteUrl}/" />
    <meta
      property="og:site_name"
      content="${escapeHtml(htmlConfig.siteName)}"
    />
    <meta
      property="og:image"
      content="${ogImageUrl}"
    />

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta property="twitter:domain" content="${htmlConfig.siteDomain}" />
    <meta property="twitter:url" content="${htmlConfig.siteUrl}/" />
    <meta name="twitter:title" content="${escapeHtml(htmlConfig.siteTitle)}" />
    <meta
      name="twitter:description"
      content="${escapeHtml(htmlConfig.siteDescription)}"
    />
    <meta
      name="twitter:image"
      content="${ogImageUrl}"
    />

    <!-- RSS Feeds -->
    <link
      rel="alternate"
      type="application/rss+xml"
      title="RSS Feed"
      href="/rss.xml"
    />
    <link
      rel="alternate"
      type="application/rss+xml"
      title="RSS Feed (Full Content)"
      href="/rss-full.xml"
    />

    <!-- LLM and AI Discovery -->
    <link rel="author" href="/llms.txt" />

    <!-- JSON-LD Structured Data for Homepage -->
    <script type="application/ld+json">
      {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "${escapeJson(htmlConfig.siteName)}",
        "url": "${htmlConfig.siteUrl}",
        "description": "${escapeJson(htmlConfig.siteDescription)}",
        "author": {
          "@type": "Organization",
          "name": "${escapeJson(htmlConfig.siteName)}",
          "url": "${htmlConfig.siteUrl}"
        },
        "potentialAction": {
          "@type": "SearchAction",
          "target": "${htmlConfig.siteUrl}/?q={search_term_string}",
          "query-input": "required name=search_term_string"
        }
      }
    </script>

    <title>${escapeHtml(htmlConfig.siteTitle)}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`;
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generateIndexHtml());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      addToast("index.html copied to clipboard", "success");
    } catch {
      // Fallback
      const textarea = document.createElement("textarea");
      textarea.value = generateIndexHtml();
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      addToast("index.html copied to clipboard", "success");
    }
  };

  const handleDownload = () => {
    const blob = new Blob([generateIndexHtml()], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "index.html";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addToast("Downloaded index.html", "success");
  };

  return (
    <div className="dashboard-config-section">
      <div className="dashboard-config-header">
        <div>
          <h2>Index HTML Generator</h2>
          <p>Generate index.html with SEO metadata, Open Graph, and Twitter Card tags</p>
        </div>
        <div className="dashboard-config-actions">
          <button className="dashboard-action-btn" onClick={handleCopy}>
            {copied ? <Check size={16} /> : <Copy size={16} />}
            <span>{copied ? "Copied" : "Copy HTML"}</span>
          </button>
          <button className="dashboard-action-btn primary" onClick={handleDownload}>
            <Download size={16} />
            <span>Download</span>
          </button>
        </div>
      </div>

      <div className="dashboard-config-grid">
        {/* Basic Metadata */}
        <div className="dashboard-config-card">
          <h3>Basic Metadata</h3>
          <div className="config-field">
            <label>Site Name</label>
            <input
              type="text"
              value={htmlConfig.siteName}
              onChange={(e) => handleChange("siteName", e.target.value)}
              placeholder="Your Site Name"
            />
            <span className="config-field-note">Used in Open Graph site_name and JSON-LD</span>
          </div>
          <div className="config-field">
            <label>Site Title</label>
            <input
              type="text"
              value={htmlConfig.siteTitle}
              onChange={(e) => handleChange("siteTitle", e.target.value)}
              placeholder="Your Site Title"
            />
            <span className="config-field-note">
              Used in &lt;title&gt; tag and Open Graph title
            </span>
          </div>
          <div className="config-field">
            <label>Site Description</label>
            <textarea
              value={htmlConfig.siteDescription}
              onChange={(e) => handleChange("siteDescription", e.target.value)}
              rows={3}
              placeholder="A brief description of your site"
            />
            <span className="config-field-note">
              Used in meta description, Open Graph, Twitter Card, and JSON-LD
            </span>
          </div>
          <div className="config-field">
            <label>Author</label>
            <input
              type="text"
              value={htmlConfig.author}
              onChange={(e) => handleChange("author", e.target.value)}
              placeholder="Author or Organization Name"
            />
          </div>
          <div className="config-field">
            <label>Keywords</label>
            <input
              type="text"
              value={htmlConfig.keywords}
              onChange={(e) => handleChange("keywords", e.target.value)}
              placeholder="keyword1, keyword2, keyword3"
            />
            <span className="config-field-note">Comma-separated keywords for SEO</span>
          </div>
        </div>

        {/* URLs and Images */}
        <div className="dashboard-config-card">
          <h3>URLs and Images</h3>
          <div className="config-field">
            <label>Site URL</label>
            <input
              type="url"
              value={htmlConfig.siteUrl}
              onChange={(e) => handleChange("siteUrl", e.target.value)}
              placeholder="https://example.com"
            />
            <span className="config-field-note">Full URL including protocol (https://)</span>
          </div>
          <div className="config-field">
            <label>Site Domain</label>
            <input
              type="text"
              value={htmlConfig.siteDomain}
              onChange={(e) => handleChange("siteDomain", e.target.value)}
              placeholder="example.com"
            />
            <span className="config-field-note">Auto-updated from Site URL, or set manually</span>
          </div>
          <div className="config-field">
            <label>Open Graph Image</label>
            <input
              type="text"
              value={htmlConfig.ogImage}
              onChange={(e) => handleChange("ogImage", e.target.value)}
              placeholder="/images/og-default.png"
            />
            <span className="config-field-note">
              Path to OG image (e.g., /images/og-default.png) or full URL
            </span>
          </div>
          <div className="config-field">
            <label>Favicon</label>
            <input
              type="text"
              value={htmlConfig.favicon}
              onChange={(e) => handleChange("favicon", e.target.value)}
              placeholder="/favicon.svg"
            />
            <span className="config-field-note">Path to favicon (e.g., /favicon.svg)</span>
          </div>
          <div className="config-field">
            <label>Theme Color</label>
            <input
              type="color"
              value={htmlConfig.themeColor}
              onChange={(e) => handleChange("themeColor", e.target.value)}
            />
            <span className="config-field-note">
              Mobile browser chrome color (theme-color meta tag)
            </span>
          </div>
        </div>
      </div>

      <div className="dashboard-config-preview">
        <h3>Preview</h3>
        <div className="dashboard-config-preview-content">
          <pre className="dashboard-code-preview">
            <code>{generateIndexHtml()}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}

/**
 * ConfigSection - Dashboard UI for generating siteConfig.ts
 *
 * IMPORTANT: Keep this section in sync with src/config/siteConfig.ts
 * When adding/modifying config options in siteConfig.ts, update:
 * 1. Initial state (useState) with the new option
 * 2. generateConfigCode() to include the option in output
 * 3. UI section with appropriate input controls
 *
 * See CLAUDE.md "Configuration alignment" section for details.
 */
function ConfigSection({
  addToast,
  onNavigateToIndexHtml,
}: {
  addToast: (message: string, type: ToastType) => void;
  onNavigateToIndexHtml?: () => void;
}) {
  const [config, setConfig] = useState({
    name: siteConfig.name,
    title: siteConfig.title,
    logo: siteConfig.logo || "",
    bio: siteConfig.bio,
    fontFamily: siteConfig.fontFamily,
    defaultTheme: siteConfig.defaultTheme || "light",
    featuredViewMode: siteConfig.featuredViewMode,
    featuredTitle: siteConfig.featuredTitle,
    showViewToggle: siteConfig.showViewToggle,
    // Blog page
    blogPageEnabled: siteConfig.blogPage.enabled,
    blogPageShowInNav: siteConfig.blogPage.showInNav,
    blogPageTitle: siteConfig.blogPage.title,
    blogPageDescription: siteConfig.blogPage.description || "",
    blogPageViewMode: siteConfig.blogPage.viewMode,
    blogPageShowViewToggle: siteConfig.blogPage.showViewToggle,
    blogPageOrder: siteConfig.blogPage.order,
    // Posts display
    showPostsOnHome: siteConfig.postsDisplay.showOnHome,
    showPostsOnBlogPage: siteConfig.postsDisplay.showOnBlogPage,
    homePostsLimit: siteConfig.postsDisplay.homePostsLimit || 0,
    homePostsReadMoreEnabled: siteConfig.postsDisplay.homePostsReadMore?.enabled || false,
    homePostsReadMoreText: siteConfig.postsDisplay.homePostsReadMore?.text || "",
    homePostsReadMoreLink: siteConfig.postsDisplay.homePostsReadMore?.link || "",
    // Right sidebar
    rightSidebarEnabled: siteConfig.rightSidebar.enabled,
    rightSidebarMinWidth: siteConfig.rightSidebar.minWidth || 1135,
    // Footer
    footerEnabled: siteConfig.footer.enabled,
    footerShowOnHomepage: siteConfig.footer.showOnHomepage,
    footerShowOnPosts: siteConfig.footer.showOnPosts,
    footerShowOnPages: siteConfig.footer.showOnPages,
    footerShowOnBlogPage: siteConfig.footer.showOnBlogPage,
    footerDefaultContent: siteConfig.footer.defaultContent || "",
    // AI Chat
    aiChatEnabledOnWritePage: siteConfig.aiChat.enabledOnWritePage,
    aiChatEnabledOnContent: siteConfig.aiChat.enabledOnContent,
    // Newsletter
    newsletterEnabled: siteConfig.newsletter?.enabled || false,
    newsletterHomeEnabled: siteConfig.newsletter?.signup?.home?.enabled || false,
    newsletterBlogPageEnabled: siteConfig.newsletter?.signup?.blogPage?.enabled || false,
    newsletterPostsEnabled: siteConfig.newsletter?.signup?.posts?.enabled || false,
    // Stats page
    statsPageEnabled: siteConfig.statsPage?.enabled || false,
    statsPageShowInNav: siteConfig.statsPage?.showInNav || false,
    // Dashboard navigation
    dashboardEnabled: siteConfig.dashboard?.enabled ?? true,
    dashboardRequireAuth: siteConfig.dashboard?.requireAuth ?? true,
    dashboardShowInNav: siteConfig.dashboard?.showInNav ?? true,
    // GitHub
    githubOwner: siteConfig.gitHubRepo.owner,
    githubRepo: siteConfig.gitHubRepo.repo,
    githubBranch: siteConfig.gitHubRepo.branch,
    githubContentPath: siteConfig.gitHubRepo.contentPath,
    // Inner page logo
    innerPageLogoEnabled: siteConfig.innerPageLogo.enabled,
    innerPageLogoSize: siteConfig.innerPageLogo.size,
    // GitHub contributions
    githubContributionsEnabled: siteConfig.gitHubContributions.enabled,
    githubContributionsUsername: siteConfig.gitHubContributions.username,
    githubContributionsShowYearNav: siteConfig.gitHubContributions.showYearNavigation,
    githubContributionsLinkToProfile: siteConfig.gitHubContributions.linkToProfile,
    // Visitor map
    visitorMapEnabled: siteConfig.visitorMap.enabled,
    visitorMapTitle: siteConfig.visitorMap.title,
    // Homepage
    homepageType: siteConfig.homepage.type,
    homepageSlug: siteConfig.homepage.slug || "",
    homepageOriginalRoute: siteConfig.homepage.originalHomeRoute || "",
    // Contact form
    contactFormEnabled: siteConfig.contactForm?.enabled || false,
    contactFormTitle: siteConfig.contactForm?.title || "",
    contactFormDescription: siteConfig.contactForm?.description || "",
    // Social footer
    socialFooterEnabled: siteConfig.socialFooter?.enabled || false,
    socialFooterShowInHeader: siteConfig.socialFooter?.showInHeader || false,
    socialFooterShowOnHomepage: siteConfig.socialFooter?.showOnHomepage || false,
    socialFooterShowOnPosts: siteConfig.socialFooter?.showOnPosts || false,
    socialFooterShowOnPages: siteConfig.socialFooter?.showOnPages || false,
    socialFooterShowOnBlogPage: siteConfig.socialFooter?.showOnBlogPage || false,
    socialFooterCopyrightSiteName: siteConfig.socialFooter?.copyright?.siteName || "",
    socialFooterCopyrightShowYear: siteConfig.socialFooter?.copyright?.showYear || false,
    // Logo gallery
    logoGalleryEnabled: siteConfig.logoGallery?.enabled || false,
    logoGalleryPosition: siteConfig.logoGallery?.position || "above-footer",
    logoGallerySpeed: siteConfig.logoGallery?.speed || 30,
    logoGalleryTitle: siteConfig.logoGallery?.title || "",
    logoGalleryScrolling: siteConfig.logoGallery?.scrolling || false,
    logoGalleryMaxItems: siteConfig.logoGallery?.maxItems || 4,
    // Links
    linksConvex: siteConfig.links?.convex || "",
    linksNetlify: siteConfig.links?.netlify || "",
    linksDocs: siteConfig.links?.docs || "",
    // MCP Server
    mcpServerEnabled: siteConfig.mcpServer?.enabled || false,
    mcpServerEndpoint: siteConfig.mcpServer?.endpoint || "/mcp",
    mcpServerRequireAuth: siteConfig.mcpServer?.requireAuth || false,
    // Image lightbox
    imageLightboxEnabled: siteConfig.imageLightbox?.enabled !== false,
    // Semantic search
    semanticSearchEnabled: siteConfig.semanticSearch?.enabled || false,
    // Ask AI
    askAIEnabled: siteConfig.askAI?.enabled || false,
    // Media library
    mediaEnabled: siteConfig.media?.enabled || false,
    mediaMaxFileSize: siteConfig.media?.maxFileSize || 10,
    // Related posts
    relatedPostsDefaultViewMode: siteConfig.relatedPosts?.defaultViewMode || "thumbnails",
    relatedPostsShowViewToggle: siteConfig.relatedPosts?.showViewToggle !== false,
  });

  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const saveOverridesMutation = useMutation(api.siteConfigData.saveOverrides);

  const handleChange = (key: string, value: string | number | boolean) => {
    setConfig({ ...config, [key]: value });
  };

  // Builds the runtime overrides object saved to Convex. Mirrors generateConfigCode()
  // field mapping, but omits arrays the dashboard cannot edit (logoGallery.images,
  // socialFooter.socialLinks, hardcodedNavItems) so the merge never clobbers file values.
  const buildOverrides = (): SiteConfigOverrides => {
    return {
      name: config.name,
      title: config.title,
      logo: config.logo || null,
      bio: config.bio,
      fontFamily: config.fontFamily,
      defaultTheme: config.defaultTheme,
      featuredViewMode: config.featuredViewMode,
      featuredTitle: config.featuredTitle,
      showViewToggle: config.showViewToggle,
      logoGallery: {
        enabled: config.logoGalleryEnabled,
        position: config.logoGalleryPosition,
        speed: config.logoGallerySpeed,
        title: config.logoGalleryTitle,
        scrolling: config.logoGalleryScrolling,
        maxItems: config.logoGalleryMaxItems,
      },
      gitHubContributions: {
        enabled: config.githubContributionsEnabled,
        username: config.githubContributionsUsername,
        showYearNavigation: config.githubContributionsShowYearNav,
        linkToProfile: config.githubContributionsLinkToProfile,
      },
      visitorMap: {
        enabled: config.visitorMapEnabled,
        title: config.visitorMapTitle,
      },
      innerPageLogo: {
        enabled: config.innerPageLogoEnabled,
        size: config.innerPageLogoSize,
      },
      blogPage: {
        enabled: config.blogPageEnabled,
        showInNav: config.blogPageShowInNav,
        title: config.blogPageTitle,
        description: config.blogPageDescription,
        order: config.blogPageOrder,
        viewMode: config.blogPageViewMode,
        showViewToggle: config.blogPageShowViewToggle,
      },
      postsDisplay: {
        showOnHome: config.showPostsOnHome,
        showOnBlogPage: config.showPostsOnBlogPage,
        ...(config.homePostsLimit ? { homePostsLimit: config.homePostsLimit } : {}),
        homePostsReadMore: {
          enabled: config.homePostsReadMoreEnabled,
          text: config.homePostsReadMoreText,
          link: config.homePostsReadMoreLink,
        },
      },
      links: {
        docs: config.linksDocs,
        convex: config.linksConvex,
        netlify: config.linksNetlify,
      },
      gitHubRepo: {
        owner: config.githubOwner,
        repo: config.githubRepo,
        branch: config.githubBranch,
        contentPath: config.githubContentPath,
      },
      rightSidebar: {
        enabled: config.rightSidebarEnabled,
        minWidth: config.rightSidebarMinWidth,
      },
      footer: {
        enabled: config.footerEnabled,
        showOnHomepage: config.footerShowOnHomepage,
        showOnPosts: config.footerShowOnPosts,
        showOnPages: config.footerShowOnPages,
        showOnBlogPage: config.footerShowOnBlogPage,
        defaultContent: config.footerDefaultContent,
      },
      homepage: {
        type: config.homepageType,
        ...(config.homepageSlug ? { slug: config.homepageSlug } : {}),
        ...(config.homepageOriginalRoute
          ? { originalHomeRoute: config.homepageOriginalRoute }
          : {}),
      },
      aiChat: {
        enabledOnWritePage: config.aiChatEnabledOnWritePage,
        enabledOnContent: config.aiChatEnabledOnContent,
      },
      newsletter: {
        enabled: config.newsletterEnabled,
        signup: {
          home: { enabled: config.newsletterHomeEnabled },
          blogPage: { enabled: config.newsletterBlogPageEnabled },
          posts: { enabled: config.newsletterPostsEnabled },
        },
      },
      contactForm: {
        enabled: config.contactFormEnabled,
        title: config.contactFormTitle,
        description: config.contactFormDescription,
      },
      socialFooter: {
        enabled: config.socialFooterEnabled,
        showInHeader: config.socialFooterShowInHeader,
        showOnHomepage: config.socialFooterShowOnHomepage,
        showOnPosts: config.socialFooterShowOnPosts,
        showOnPages: config.socialFooterShowOnPages,
        showOnBlogPage: config.socialFooterShowOnBlogPage,
        copyright: {
          siteName: config.socialFooterCopyrightSiteName,
          showYear: config.socialFooterCopyrightShowYear,
        },
      },
      statsPage: {
        enabled: config.statsPageEnabled,
        showInNav: config.statsPageShowInNav,
      },
      mcpServer: {
        enabled: config.mcpServerEnabled,
        endpoint: config.mcpServerEndpoint,
        requireAuth: config.mcpServerRequireAuth,
      },
      dashboard: {
        enabled: config.dashboardEnabled,
        requireAuth: config.dashboardRequireAuth,
        showInNav: config.dashboardShowInNav,
      },
      imageLightbox: { enabled: config.imageLightboxEnabled },
      semanticSearch: { enabled: config.semanticSearchEnabled },
      askAI: { enabled: config.askAIEnabled },
      media: {
        enabled: config.mediaEnabled,
        maxFileSize: config.mediaMaxFileSize,
      },
      relatedPosts: {
        defaultViewMode: config.relatedPostsDefaultViewMode,
        showViewToggle: config.relatedPostsShowViewToggle,
      },
    };
  };

  // Saves overrides to Convex so they go live without editing siteConfig.ts
  const handleSaveConfig = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await saveOverridesMutation({ overrides: buildOverrides() });
      addToast("Config saved. Changes go live on next page load.", "success");
    } catch {
      addToast("Failed to save config", "error");
    } finally {
      setSaving(false);
    }
  };

  const generateConfigCode = () => {
    return `// Generated by Dashboard Config Generator
// Copy this file to src/config/siteConfig.ts
// For full type definitions, see the original siteConfig.ts file
// Homepage content comes from content/pages/home.md (not siteConfig bio)

import { ReactNode } from "react";
export type { LogoItem, LogoGalleryConfig } from "../components/LogoMarquee";
import type { LogoGalleryConfig } from "../components/LogoMarquee";

// ... (type definitions remain the same - copy from original siteConfig.ts)

export const siteConfig: SiteConfig = {
  name: "${config.name}",
  title: "${config.title}",
  logo: ${config.logo ? `"${config.logo}"` : "null"},
  intro: null,
  bio: \`${config.bio}\`,
  fontFamily: "${config.fontFamily}",
  defaultTheme: "${config.defaultTheme}",
  featuredViewMode: "${config.featuredViewMode}",
  featuredTitle: "${config.featuredTitle}",
  showViewToggle: ${config.showViewToggle},
  
  // Logo gallery - customize images array as needed
  logoGallery: {
    enabled: ${config.logoGalleryEnabled},
    images: [], // Add your logo images here - see original siteConfig.ts for format
    position: "${config.logoGalleryPosition}",
    speed: ${config.logoGallerySpeed},
    title: "${config.logoGalleryTitle}",
    scrolling: ${config.logoGalleryScrolling},
    maxItems: ${config.logoGalleryMaxItems},
  },
  
  gitHubContributions: {
    enabled: ${config.githubContributionsEnabled},
    username: "${config.githubContributionsUsername}",
    showYearNavigation: ${config.githubContributionsShowYearNav},
    linkToProfile: ${config.githubContributionsLinkToProfile},
    title: "GitHub Activity",
  },
  
  visitorMap: {
    enabled: ${config.visitorMapEnabled},
    title: "${config.visitorMapTitle}",
  },
  
  innerPageLogo: {
    enabled: ${config.innerPageLogoEnabled},
    size: ${config.innerPageLogoSize},
  },
  
  blogPage: {
    enabled: ${config.blogPageEnabled},
    showInNav: ${config.blogPageShowInNav},
    title: "${config.blogPageTitle}",
    description: "${config.blogPageDescription}",
    order: ${config.blogPageOrder},
    viewMode: "${config.blogPageViewMode}",
    showViewToggle: ${config.blogPageShowViewToggle},
  },
  
  hardcodedNavItems: [
    { slug: "stats", title: "Stats", order: 10, showInNav: ${config.statsPageShowInNav} },
    { slug: "write", title: "Write", order: 20, showInNav: true },
    { slug: "dashboard", title: "Dashboard", order: 21, showInNav: ${config.dashboardShowInNav} },
  ],
  
  postsDisplay: {
    showOnHome: ${config.showPostsOnHome},
    showOnBlogPage: ${config.showPostsOnBlogPage},
    homePostsLimit: ${config.homePostsLimit || "undefined"},
    homePostsReadMore: {
      enabled: ${config.homePostsReadMoreEnabled},
      text: "${config.homePostsReadMoreText}",
      link: "${config.homePostsReadMoreLink}",
    },
  },
  
  links: {
    docs: "${config.linksDocs}",
    convex: "${config.linksConvex}",
    netlify: "${config.linksNetlify}",
  },
  
  gitHubRepo: {
    owner: "${config.githubOwner}",
    repo: "${config.githubRepo}",
    branch: "${config.githubBranch}",
    contentPath: "${config.githubContentPath}",
  },
  
  rightSidebar: {
    enabled: ${config.rightSidebarEnabled},
    minWidth: ${config.rightSidebarMinWidth},
  },
  
  footer: {
    enabled: ${config.footerEnabled},
    showOnHomepage: ${config.footerShowOnHomepage},
    showOnPosts: ${config.footerShowOnPosts},
    showOnPages: ${config.footerShowOnPages},
    showOnBlogPage: ${config.footerShowOnBlogPage},
    defaultContent: \`${config.footerDefaultContent}\`,
  },
  
  homepage: {
    type: "${config.homepageType}",
    slug: ${config.homepageSlug ? `"${config.homepageSlug}"` : "undefined"},
    originalHomeRoute: "${config.homepageOriginalRoute}",
  },
  
  aiChat: {
    enabledOnWritePage: ${config.aiChatEnabledOnWritePage},
    enabledOnContent: ${config.aiChatEnabledOnContent},
  },
  
  newsletter: {
    enabled: ${config.newsletterEnabled},
    signup: {
      home: { enabled: ${config.newsletterHomeEnabled}, position: "above-footer", title: "Stay Updated", description: "Get new posts delivered to your inbox." },
      blogPage: { enabled: ${config.newsletterBlogPageEnabled}, position: "above-footer", title: "Subscribe", description: "Get notified when new posts are published." },
      posts: { enabled: ${config.newsletterPostsEnabled}, position: "below-content", title: "Enjoyed this post?", description: "Subscribe for more updates." },
    },
  },
  
  contactForm: {
    enabled: ${config.contactFormEnabled},
    title: "${config.contactFormTitle}",
    description: "${config.contactFormDescription}",
  },
  
  socialFooter: {
    enabled: ${config.socialFooterEnabled},
    showInHeader: ${config.socialFooterShowInHeader},
    showOnHomepage: ${config.socialFooterShowOnHomepage},
    showOnPosts: ${config.socialFooterShowOnPosts},
    showOnPages: ${config.socialFooterShowOnPages},
    showOnBlogPage: ${config.socialFooterShowOnBlogPage},
    socialLinks: [], // Add your social links here - see original siteConfig.ts for format
    copyright: { siteName: "${config.socialFooterCopyrightSiteName}", showYear: ${config.socialFooterCopyrightShowYear} },
  },
  
  newsletterAdmin: { enabled: false, showInNav: false },
  
  statsPage: {
    enabled: ${config.statsPageEnabled},
    showInNav: ${config.statsPageShowInNav},
  },
  
  newsletterNotifications: { enabled: true, newSubscriberAlert: true, weeklyStatsSummary: true },
  weeklyDigest: { enabled: true, dayOfWeek: 0, subject: "Weekly Digest" },
  mcpServer: { enabled: ${config.mcpServerEnabled}, endpoint: "${config.mcpServerEndpoint}", publicRateLimit: 50, authenticatedRateLimit: 1000, requireAuth: ${config.mcpServerRequireAuth} },
  dashboard: { enabled: ${config.dashboardEnabled}, requireAuth: ${config.dashboardRequireAuth}, showInNav: ${config.dashboardShowInNav} },
  
  // Image lightbox configuration
  // Enables click-to-magnify functionality for images in blog posts and pages
  imageLightbox: {
    enabled: ${config.imageLightboxEnabled},
  },

  // Semantic search configuration
  // Set enabled: true to enable AI-powered semantic search (requires OPENAI_API_KEY in Convex)
  semanticSearch: {
    enabled: ${config.semanticSearchEnabled},
  },

  // Ask AI header button (requires semanticSearch.enabled and API keys)
  askAI: {
    enabled: ${config.askAIEnabled},
  },

  // Media library configuration
  // Upload and manage images via ConvexFS and Bunny.net CDN
  // Requires BUNNY_API_KEY, BUNNY_STORAGE_ZONE, BUNNY_CDN_HOSTNAME in Convex dashboard
  media: {
    enabled: ${config.mediaEnabled},
    maxFileSize: ${config.mediaMaxFileSize},
    allowedTypes: ["image/png", "image/jpeg", "image/gif", "image/webp"],
  },

  // Related posts configuration
  // Controls the display of related posts at the bottom of blog posts
  relatedPosts: {
    defaultViewMode: "${config.relatedPostsDefaultViewMode}",
    showViewToggle: ${config.relatedPostsShowViewToggle},
  },
};

export default siteConfig;
`;
  };

  const handleCopyConfig = async () => {
    await navigator.clipboard.writeText(generateConfigCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    addToast("Config code copied to clipboard", "success");
  };

  const handleDownloadConfig = () => {
    const blob = new Blob([generateConfigCode()], { type: "text/typescript" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "siteConfig.ts";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addToast("Downloaded siteConfig.ts", "success");
  };

  return (
    <div className="dashboard-config-section">
      <div className="dashboard-config-header">
        <div>
          <h2>Site Configuration</h2>
          <p>Save changes live to the site, or generate siteConfig.ts for your repo</p>
        </div>
        <div className="dashboard-config-actions">
          <button className="dashboard-action-btn" onClick={handleCopyConfig}>
            {copied ? <Check size={16} /> : <Copy size={16} />}
            <span>{copied ? "Copied" : "Copy Code"}</span>
          </button>
          <button className="dashboard-action-btn" onClick={handleDownloadConfig}>
            <Download size={16} />
            <span>Download</span>
          </button>
          {/* Hidden on phones; the sticky bar at the end of the section takes over */}
          <button
            className="dashboard-action-btn primary dashboard-save-inline"
            onClick={handleSaveConfig}
            disabled={saving}
          >
            <FloppyDisk size={16} />
            <span>{saving ? "Saving..." : "Save"}</span>
          </button>
        </div>
      </div>

      <div className="dashboard-config-reminder">
        <Info size={16} />
        <span>
          Don't forget to update <strong>index.html</strong> with matching metadata!
          <button className="dashboard-link-button" onClick={onNavigateToIndexHtml}>
            Go to Index HTML Generator →
          </button>
        </span>
      </div>

      <div className="dashboard-config-grid">
        {/* Basic Settings */}
        <div className="dashboard-config-card">
          <h3>Basic Settings</h3>
          <div className="config-field">
            <label>Site Name</label>
            <input
              type="text"
              value={config.name}
              onChange={(e) => handleChange("name", e.target.value)}
            />
          </div>
          <div className="config-field">
            <label>Site Title</label>
            <input
              type="text"
              value={config.title}
              onChange={(e) => handleChange("title", e.target.value)}
            />
          </div>
          <div className="config-field">
            <label>Logo Path</label>
            <input
              type="text"
              value={config.logo}
              onChange={(e) => handleChange("logo", e.target.value)}
              placeholder="/images/logo.svg"
            />
          </div>
          <div className="config-field">
            <label>Bio</label>
            <textarea
              value={config.bio}
              onChange={(e) => handleChange("bio", e.target.value)}
              rows={2}
            />
            <span className="config-field-note">
              Note: Bio is set in siteConfig.ts. Homepage content is separate and comes from
              content/pages/home.md
            </span>
          </div>
          <div className="config-field">
            <label>Font Family</label>
            <select
              value={config.fontFamily}
              onChange={(e) => handleChange("fontFamily", e.target.value)}>
              <option value="serif">Serif (New York)</option>
              <option value="sans">Sans (System)</option>
              <option value="monospace">Monospace (IBM Plex Mono)</option>
            </select>
          </div>
          <div className="config-field">
            <label>Default Theme</label>
            <select
              value={config.defaultTheme}
              onChange={(e) => handleChange("defaultTheme", e.target.value)}>
              <option value="light">Light (white canvas, geometric sans)</option>
              <option value="dark">Dark (black canvas, editorial serif)</option>
              <option value="tan">Tan</option>
              <option value="cloud">Cloud</option>
            </select>
            <span className="config-hint">
              Theme new visitors see before they pick their own
            </span>
          </div>
        </div>

        {/* Blog Page Settings */}
        <div className="dashboard-config-card">
          <h3>Blog Page</h3>
          <div className="config-field checkbox">
            <label>
              <input
                type="checkbox"
                checked={config.blogPageEnabled}
                onChange={(e) => handleChange("blogPageEnabled", e.target.checked)}
              />
              <span>Enable /blog route</span>
            </label>
          </div>
          <div className="config-field checkbox">
            <label>
              <input
                type="checkbox"
                checked={config.blogPageShowInNav}
                onChange={(e) => handleChange("blogPageShowInNav", e.target.checked)}
              />
              <span>Show in navigation</span>
            </label>
          </div>
          <div className="config-field">
            <label>Blog Title</label>
            <input
              type="text"
              value={config.blogPageTitle}
              onChange={(e) => handleChange("blogPageTitle", e.target.value)}
            />
          </div>
          <div className="config-field">
            <label>Default View Mode</label>
            <select
              value={config.blogPageViewMode}
              onChange={(e) => handleChange("blogPageViewMode", e.target.value)}>
              <option value="list">List</option>
              <option value="cards">Cards</option>
            </select>
            <span className="config-hint">
              View new visitors see first on /blog
            </span>
          </div>
          <div className="config-field checkbox">
            <label>
              <input
                type="checkbox"
                checked={config.blogPageShowViewToggle}
                onChange={(e) =>
                  handleChange("blogPageShowViewToggle", e.target.checked)
                }
              />
              <span>Show view toggle icons</span>
            </label>
            <span className="config-hint">
              Hide to lock the blog to the default view mode
            </span>
          </div>
        </div>

        {/* Posts Display */}
        <div className="dashboard-config-card">
          <h3>Posts Display</h3>
          <div className="config-field checkbox">
            <label>
              <input
                type="checkbox"
                checked={config.showPostsOnHome}
                onChange={(e) => handleChange("showPostsOnHome", e.target.checked)}
              />
              <span>Show posts on homepage</span>
            </label>
          </div>
          <div className="config-field checkbox">
            <label>
              <input
                type="checkbox"
                checked={config.showPostsOnBlogPage}
                onChange={(e) => handleChange("showPostsOnBlogPage", e.target.checked)}
              />
              <span>Show posts on blog page</span>
            </label>
          </div>
          <div className="config-field">
            <label>Home Posts Limit (0 = all)</label>
            <input
              type="number"
              value={config.homePostsLimit}
              onChange={(e) => handleChange("homePostsLimit", parseInt(e.target.value) || 0)}
              min={0}
            />
          </div>
        </div>

        {/* Featured Section */}
        <div className="dashboard-config-card">
          <h3>Featured Section</h3>
          <div className="config-field">
            <label>Featured Title</label>
            <input
              type="text"
              value={config.featuredTitle}
              onChange={(e) => handleChange("featuredTitle", e.target.value)}
            />
          </div>
          <div className="config-field">
            <label>View Mode</label>
            <select
              value={config.featuredViewMode}
              onChange={(e) => handleChange("featuredViewMode", e.target.value)}>
              <option value="list">List</option>
              <option value="cards">Cards</option>
            </select>
          </div>
          <div className="config-field checkbox">
            <label>
              <input
                type="checkbox"
                checked={config.showViewToggle}
                onChange={(e) => handleChange("showViewToggle", e.target.checked)}
              />
              <span>Show view toggle</span>
            </label>
          </div>
        </div>

        {/* Footer Settings */}
        <div className="dashboard-config-card">
          <h3>Footer</h3>
          <div className="config-field checkbox">
            <label>
              <input
                type="checkbox"
                checked={config.footerEnabled}
                onChange={(e) => handleChange("footerEnabled", e.target.checked)}
              />
              <span>Enable footer</span>
            </label>
          </div>
          <div className="config-field checkbox">
            <label>
              <input
                type="checkbox"
                checked={config.footerShowOnHomepage}
                onChange={(e) => handleChange("footerShowOnHomepage", e.target.checked)}
              />
              <span>Show on homepage</span>
            </label>
          </div>
          <div className="config-field checkbox">
            <label>
              <input
                type="checkbox"
                checked={config.footerShowOnPosts}
                onChange={(e) => handleChange("footerShowOnPosts", e.target.checked)}
              />
              <span>Show on posts</span>
            </label>
          </div>
          <div className="config-field checkbox">
            <label>
              <input
                type="checkbox"
                checked={config.footerShowOnPages}
                onChange={(e) => handleChange("footerShowOnPages", e.target.checked)}
              />
              <span>Show on pages</span>
            </label>
          </div>
          <p className="config-field-note" style={{ marginTop: "0.75rem" }}>
            Footer content is managed via <code>content/pages/footer.md</code>. Run{" "}
            <code>npm run sync</code> to update.
          </p>
        </div>

        {/* AI Chat Settings */}
        <div className="dashboard-config-card">
          <h3>AI Chat</h3>
          <div className="config-field checkbox">
            <label>
              <input
                type="checkbox"
                checked={config.aiChatEnabledOnWritePage}
                onChange={(e) => handleChange("aiChatEnabledOnWritePage", e.target.checked)}
              />
              <span>Enable on Write page</span>
            </label>
          </div>
          <div className="config-field checkbox">
            <label>
              <input
                type="checkbox"
                checked={config.aiChatEnabledOnContent}
                onChange={(e) => handleChange("aiChatEnabledOnContent", e.target.checked)}
              />
              <span>Enable on content pages</span>
            </label>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="dashboard-config-card">
          <h3>Right Sidebar</h3>
          <div className="config-field checkbox">
            <label>
              <input
                type="checkbox"
                checked={config.rightSidebarEnabled}
                onChange={(e) => handleChange("rightSidebarEnabled", e.target.checked)}
              />
              <span>Enable right sidebar</span>
            </label>
          </div>
          <div className="config-field">
            <label>Min Width (px)</label>
            <input
              type="number"
              value={config.rightSidebarMinWidth}
              onChange={(e) =>
                handleChange("rightSidebarMinWidth", parseInt(e.target.value) || 1135)
              }
              min={768}
            />
          </div>
        </div>

        {/* Features */}
        <div className="dashboard-config-card">
          <h3>Features</h3>
          <div className="config-field checkbox">
            <label>
              <input
                type="checkbox"
                checked={config.newsletterEnabled}
                onChange={(e) => handleChange("newsletterEnabled", e.target.checked)}
              />
              <span>Enable newsletter</span>
            </label>
          </div>
          <div className="config-field checkbox">
            <label>
              <input
                type="checkbox"
                checked={config.statsPageEnabled}
                onChange={(e) => handleChange("statsPageEnabled", e.target.checked)}
              />
              <span>Enable stats page</span>
            </label>
          </div>
          <div className="config-field checkbox">
            <label>
              <input
                type="checkbox"
                checked={config.statsPageShowInNav}
                onChange={(e) => handleChange("statsPageShowInNav", e.target.checked)}
              />
              <span>Show stats in nav</span>
            </label>
          </div>
          <div className="config-field checkbox">
            <label>
              <input
                type="checkbox"
                checked={config.dashboardEnabled}
                onChange={(e) => handleChange("dashboardEnabled", e.target.checked)}
              />
              <span>Enable dashboard page</span>
            </label>
          </div>
          <div className="config-field checkbox">
            <label>
              <input
                type="checkbox"
                checked={config.dashboardRequireAuth}
                onChange={(e) => handleChange("dashboardRequireAuth", e.target.checked)}
              />
              <span>Require dashboard auth</span>
            </label>
          </div>
          <div className="config-field checkbox">
            <label>
              <input
                type="checkbox"
                checked={config.dashboardShowInNav}
                onChange={(e) => handleChange("dashboardShowInNav", e.target.checked)}
              />
              <span>Show dashboard in nav (admins only)</span>
            </label>
          </div>
          <div className="config-field checkbox">
            <label>
              <input
                type="checkbox"
                checked={config.visitorMapEnabled}
                onChange={(e) => handleChange("visitorMapEnabled", e.target.checked)}
              />
              <span>Enable visitor map</span>
            </label>
          </div>
        </div>

        {/* GitHub Settings */}
        <div className="dashboard-config-card">
          <h3>GitHub Repository</h3>
          <div className="config-field">
            <label>Owner</label>
            <input
              type="text"
              value={config.githubOwner}
              onChange={(e) => handleChange("githubOwner", e.target.value)}
            />
          </div>
          <div className="config-field">
            <label>Repository</label>
            <input
              type="text"
              value={config.githubRepo}
              onChange={(e) => handleChange("githubRepo", e.target.value)}
            />
          </div>
          <div className="config-field">
            <label>Branch</label>
            <input
              type="text"
              value={config.githubBranch}
              onChange={(e) => handleChange("githubBranch", e.target.value)}
            />
          </div>
          <div className="config-field checkbox">
            <label>
              <input
                type="checkbox"
                checked={config.githubContributionsEnabled}
                onChange={(e) => handleChange("githubContributionsEnabled", e.target.checked)}
              />
              <span>Enable contributions graph</span>
            </label>
          </div>
          <div className="config-field">
            <label>Contributions Username</label>
            <input
              type="text"
              value={config.githubContributionsUsername}
              onChange={(e) => handleChange("githubContributionsUsername", e.target.value)}
            />
          </div>
        </div>

        {/* Inner Page Logo */}
        <div className="dashboard-config-card">
          <h3>Inner Page Logo</h3>
          <div className="config-field checkbox">
            <label>
              <input
                type="checkbox"
                checked={config.innerPageLogoEnabled}
                onChange={(e) => handleChange("innerPageLogoEnabled", e.target.checked)}
              />
              <span>Enable inner page logo</span>
            </label>
          </div>
          <div className="config-field">
            <label>Logo Size (px)</label>
            <input
              type="number"
              value={config.innerPageLogoSize}
              onChange={(e) => handleChange("innerPageLogoSize", parseInt(e.target.value) || 28)}
              min={16}
              max={64}
            />
          </div>
        </div>

        {/* Homepage Settings */}
        <div className="dashboard-config-card">
          <h3>Homepage</h3>
          <div className="config-field">
            <label>Type</label>
            <select
              value={config.homepageType}
              onChange={(e) => handleChange("homepageType", e.target.value)}>
              <option value="default">Default</option>
              <option value="post">Post</option>
              <option value="page">Page</option>
            </select>
          </div>
          <div className="config-field">
            <label>Slug (for post/page type)</label>
            <input
              type="text"
              value={config.homepageSlug}
              onChange={(e) => handleChange("homepageSlug", e.target.value)}
              placeholder="home"
            />
          </div>
          <div className="config-field">
            <label>Original Home Route</label>
            <input
              type="text"
              value={config.homepageOriginalRoute}
              onChange={(e) => handleChange("homepageOriginalRoute", e.target.value)}
              placeholder="/home"
            />
          </div>
          <span className="config-field-note">
            Homepage content comes from content/pages/home.md (not siteConfig bio)
          </span>
        </div>

        {/* Contact Form */}
        <div className="dashboard-config-card">
          <h3>Contact Form</h3>
          <div className="config-field checkbox">
            <label>
              <input
                type="checkbox"
                checked={config.contactFormEnabled}
                onChange={(e) => handleChange("contactFormEnabled", e.target.checked)}
              />
              <span>Enable contact form</span>
            </label>
          </div>
          <div className="config-field">
            <label>Title</label>
            <input
              type="text"
              value={config.contactFormTitle}
              onChange={(e) => handleChange("contactFormTitle", e.target.value)}
            />
          </div>
          <div className="config-field">
            <label>Description</label>
            <input
              type="text"
              value={config.contactFormDescription}
              onChange={(e) => handleChange("contactFormDescription", e.target.value)}
            />
          </div>
        </div>

        {/* Social Footer */}
        <div className="dashboard-config-card">
          <h3>Social Footer</h3>
          <div className="config-field checkbox">
            <label>
              <input
                type="checkbox"
                checked={config.socialFooterEnabled}
                onChange={(e) => handleChange("socialFooterEnabled", e.target.checked)}
              />
              <span>Enable social footer</span>
            </label>
          </div>
          <div className="config-field checkbox">
            <label>
              <input
                type="checkbox"
                checked={config.socialFooterShowInHeader}
                onChange={(e) => handleChange("socialFooterShowInHeader", e.target.checked)}
              />
              <span>Show in header</span>
            </label>
          </div>
          <div className="config-field checkbox">
            <label>
              <input
                type="checkbox"
                checked={config.socialFooterShowOnHomepage}
                onChange={(e) => handleChange("socialFooterShowOnHomepage", e.target.checked)}
              />
              <span>Show on homepage</span>
            </label>
          </div>
          <div className="config-field checkbox">
            <label>
              <input
                type="checkbox"
                checked={config.socialFooterShowOnPosts}
                onChange={(e) => handleChange("socialFooterShowOnPosts", e.target.checked)}
              />
              <span>Show on posts</span>
            </label>
          </div>
          <div className="config-field">
            <label>Copyright Site Name</label>
            <input
              type="text"
              value={config.socialFooterCopyrightSiteName}
              onChange={(e) => handleChange("socialFooterCopyrightSiteName", e.target.value)}
            />
          </div>
          <div className="config-field checkbox">
            <label>
              <input
                type="checkbox"
                checked={config.socialFooterCopyrightShowYear}
                onChange={(e) => handleChange("socialFooterCopyrightShowYear", e.target.checked)}
              />
              <span>Show year in copyright</span>
            </label>
          </div>
        </div>

        {/* Logo Gallery */}
        <div className="dashboard-config-card">
          <h3>Logo Gallery</h3>
          <div className="config-field checkbox">
            <label>
              <input
                type="checkbox"
                checked={config.logoGalleryEnabled}
                onChange={(e) => handleChange("logoGalleryEnabled", e.target.checked)}
              />
              <span>Enable logo gallery</span>
            </label>
          </div>
          <div className="config-field">
            <label>Position</label>
            <select
              value={config.logoGalleryPosition}
              onChange={(e) => handleChange("logoGalleryPosition", e.target.value)}>
              <option value="above-featured">Above Featured</option>
              <option value="above-footer">Above Footer</option>
            </select>
          </div>
          <div className="config-field">
            <label>Title</label>
            <input
              type="text"
              value={config.logoGalleryTitle}
              onChange={(e) => handleChange("logoGalleryTitle", e.target.value)}
            />
          </div>
          <div className="config-field checkbox">
            <label>
              <input
                type="checkbox"
                checked={config.logoGalleryScrolling}
                onChange={(e) => handleChange("logoGalleryScrolling", e.target.checked)}
              />
              <span>Enable scrolling marquee</span>
            </label>
          </div>
          <div className="config-field">
            <label>Scroll Speed</label>
            <input
              type="number"
              value={config.logoGallerySpeed}
              onChange={(e) => handleChange("logoGallerySpeed", parseInt(e.target.value) || 30)}
              min={1}
              max={100}
            />
          </div>
          <div className="config-field">
            <label>Max Items (when not scrolling)</label>
            <input
              type="number"
              value={config.logoGalleryMaxItems}
              onChange={(e) => handleChange("logoGalleryMaxItems", parseInt(e.target.value) || 4)}
              min={1}
              max={20}
            />
          </div>
          <span className="config-field-note">
            Logo images are configured in the logoGallery.images array in siteConfig.ts
          </span>
        </div>

        {/* Newsletter Signup Locations */}
        <div className="dashboard-config-card">
          <h3>Newsletter Signup Locations</h3>
          <div className="config-field checkbox">
            <label>
              <input
                type="checkbox"
                checked={config.newsletterHomeEnabled}
                onChange={(e) => handleChange("newsletterHomeEnabled", e.target.checked)}
              />
              <span>Show on homepage</span>
            </label>
          </div>
          <div className="config-field checkbox">
            <label>
              <input
                type="checkbox"
                checked={config.newsletterBlogPageEnabled}
                onChange={(e) => handleChange("newsletterBlogPageEnabled", e.target.checked)}
              />
              <span>Show on blog page</span>
            </label>
          </div>
          <div className="config-field checkbox">
            <label>
              <input
                type="checkbox"
                checked={config.newsletterPostsEnabled}
                onChange={(e) => handleChange("newsletterPostsEnabled", e.target.checked)}
              />
              <span>Show on posts</span>
            </label>
          </div>
        </div>

        {/* MCP Server */}
        <div className="dashboard-config-card">
          <h3>MCP Server</h3>
          <div className="config-field checkbox">
            <label>
              <input
                type="checkbox"
                checked={config.mcpServerEnabled}
                onChange={(e) => handleChange("mcpServerEnabled", e.target.checked)}
              />
              <span>Enable MCP server</span>
            </label>
          </div>
          <div className="config-field">
            <label>Endpoint</label>
            <input
              type="text"
              value={config.mcpServerEndpoint}
              onChange={(e) => handleChange("mcpServerEndpoint", e.target.value)}
              placeholder="/mcp"
            />
          </div>
          <div className="config-field checkbox">
            <label>
              <input
                type="checkbox"
                checked={config.mcpServerRequireAuth}
                onChange={(e) => handleChange("mcpServerRequireAuth", e.target.checked)}
              />
              <span>Require authentication</span>
            </label>
          </div>
        </div>

        {/* Image Lightbox */}
        <div className="dashboard-config-card">
          <h3>Image Lightbox</h3>
          <div className="config-field checkbox">
            <label>
              <input
                type="checkbox"
                checked={config.imageLightboxEnabled}
                onChange={(e) => handleChange("imageLightboxEnabled", e.target.checked)}
              />
              <span>Enable image lightbox (click images to magnify)</span>
            </label>
          </div>
        </div>

        {/* Semantic Search */}
        <div className="dashboard-config-card">
          <h3>Semantic Search</h3>
          <div className="config-field checkbox">
            <label>
              <input
                type="checkbox"
                checked={config.semanticSearchEnabled}
                onChange={(e) => handleChange("semanticSearchEnabled", e.target.checked)}
              />
              <span>Enable semantic search (requires OPENAI_API_KEY in Convex)</span>
            </label>
          </div>
          <p className="config-hint">
            When enabled, search modal shows both Keyword and Semantic modes. Requires OpenAI API
            key for embeddings.
          </p>
        </div>

        {/* Ask AI */}
        <div className="dashboard-config-card">
          <h3>Ask AI</h3>
          <div className="config-field checkbox">
            <label>
              <input
                type="checkbox"
                checked={config.askAIEnabled}
                onChange={(e) => handleChange("askAIEnabled", e.target.checked)}
              />
              <span>Enable Ask AI header button</span>
            </label>
          </div>
          <p className="config-hint">
            Shows a sparkle icon in header. Requires semantic search enabled and API keys
            (ANTHROPIC_API_KEY or OPENAI_API_KEY in Convex).
          </p>
        </div>

        {/* Media Library */}
        <div className="dashboard-config-card">
          <h3>Media Library</h3>
          <div className="config-field checkbox">
            <label>
              <input
                type="checkbox"
                checked={config.mediaEnabled}
                onChange={(e) => handleChange("mediaEnabled", e.target.checked)}
              />
              <span>Enable media library</span>
            </label>
          </div>
          <div className="config-field">
            <label>Max File Size (MB)</label>
            <input
              type="number"
              value={config.mediaMaxFileSize}
              onChange={(e) => handleChange("mediaMaxFileSize", parseInt(e.target.value) || 10)}
              min={1}
              max={50}
            />
          </div>
          <p className="config-hint">
            Upload and manage images via ConvexFS and Bunny.net CDN. Requires BUNNY_API_KEY,
            BUNNY_STORAGE_ZONE, and BUNNY_CDN_HOSTNAME in Convex dashboard.
          </p>
        </div>

        {/* Related Posts */}
        <div className="dashboard-config-card">
          <h3>Related Posts</h3>
          <div className="config-field">
            <label>Default View Mode</label>
            <select
              value={config.relatedPostsDefaultViewMode}
              onChange={(e) => handleChange("relatedPostsDefaultViewMode", e.target.value)}>
              <option value="thumbnails">Thumbnails</option>
              <option value="list">List</option>
            </select>
          </div>
          <div className="config-field checkbox">
            <label>
              <input
                type="checkbox"
                checked={config.relatedPostsShowViewToggle}
                onChange={(e) => handleChange("relatedPostsShowViewToggle", e.target.checked)}
              />
              <span>Show view toggle button</span>
            </label>
          </div>
          <p className="config-hint">
            Controls the display of related posts at the bottom of blog posts. Thumbnails view shows
            image, title, description and author.
          </p>
        </div>

        {/* Version Control */}
        <VersionControlCard addToast={addToast} />

        {/* Links */}
        <div className="dashboard-config-card">
          <h3>External Links</h3>
          <div className="config-field">
            <label>Docs Link</label>
            <input
              type="text"
              value={config.linksDocs}
              onChange={(e) => handleChange("linksDocs", e.target.value)}
              placeholder="/setup-guide"
            />
          </div>
          <div className="config-field">
            <label>Convex Link</label>
            <input
              type="text"
              value={config.linksConvex}
              onChange={(e) => handleChange("linksConvex", e.target.value)}
              placeholder="https://convex.dev"
            />
          </div>
          <div className="config-field">
            <label>Netlify Link</label>
            <input
              type="text"
              value={config.linksNetlify}
              onChange={(e) => handleChange("linksNetlify", e.target.value)}
              placeholder="https://netlify.com"
            />
          </div>
        </div>
      </div>

      <div className="dashboard-config-note">
        <p>
          <strong>Save</strong> stores these settings in Convex and applies them live on the next
          page load. No rebuild needed. <strong>Copy Code</strong> or <strong>Download</strong>{" "}
          generates <code>src/config/siteConfig.ts</code> if you want the changes in your repo as
          the build-time default. Logo gallery images, social links, and custom nav items are
          managed in the file only.
        </p>
      </div>

      {/* Phones only: Save is otherwise 22 cards above wherever you just edited */}
      <div className="dashboard-config-savebar">
        <button
          className="dashboard-action-btn primary"
          onClick={handleSaveConfig}
          disabled={saving}
        >
          <FloppyDisk size={16} />
          <span>{saving ? "Saving..." : "Save"}</span>
        </button>
      </div>
    </div>
  );
}

// Version Control Card Component
function VersionControlCard({
  addToast,
}: {
  addToast: (message: string, type: ToastType) => void;
}) {
  const versionControlEnabled = useQuery(api.versions.isEnabled);
  const versionStats = useQuery(api.versions.getStats);
  const setVersionControlEnabled = useMutation(api.versions.setEnabled);
  const [isToggling, setIsToggling] = useState(false);

  const handleToggle = async () => {
    setIsToggling(true);
    try {
      await setVersionControlEnabled({ enabled: !versionControlEnabled });
      addToast(`Version control ${!versionControlEnabled ? "enabled" : "disabled"}`, "success");
    } catch {
      addToast("Failed to update version control setting", "error");
    } finally {
      setIsToggling(false);
    }
  };

  const formatDate = (timestamp: number | null) => {
    if (!timestamp) return "N/A";
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="dashboard-config-card">
      <h3>Version Control</h3>
      <div className="config-field checkbox">
        <label>
          <input
            type="checkbox"
            checked={versionControlEnabled ?? false}
            onChange={handleToggle}
            disabled={isToggling}
          />
          <span>{isToggling ? "Updating..." : "Enable version history (3-day retention)"}</span>
        </label>
      </div>
      <p className="config-hint">
        When enabled, saves a snapshot before each edit. View and restore previous versions from the
        editor toolbar.
      </p>
      {versionStats && (versionStats.totalVersions === null || versionStats.totalVersions > 0) && (
        <div className="version-stats">
          <div className="version-stat">
            <span className="version-stat-label">Total versions:</span>
            <span className="version-stat-value">
              {versionStats.totalVersions === null
                ? "Large dataset (count omitted)"
                : versionStats.totalVersions}
            </span>
          </div>
          <div className="version-stat">
            <span className="version-stat-label">Oldest:</span>
            <span className="version-stat-value">{formatDate(versionStats.oldestVersion)}</span>
          </div>
          <div className="version-stat">
            <span className="version-stat-label">Newest:</span>
            <span className="version-stat-value">{formatDate(versionStats.newestVersion)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function StatsSection() {
  const [tick, setTick] = useState(() => Math.floor(Date.now() / 60_000));
  useEffect(() => {
    const id = setInterval(() => setTick(Math.floor(Date.now() / 60_000)), 60_000);
    return () => clearInterval(id);
  }, []);
  const stats = useQuery(api.stats.getStats, { now: tick * 60_000 });

  return (
    <div className="dashboard-stats-section">
      <div className="dashboard-stats-grid">
        <div className="dashboard-stat-card">
          <div className="stat-icon">
            <Eye size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats?.activeVisitors ?? 0}</span>
            <span className="stat-label">Active Visitors</span>
          </div>
        </div>

        <div className="dashboard-stat-card">
          <div className="stat-icon">
            <ChartLine size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats?.totalPageViews ?? 0}</span>
            <span className="stat-label">Total Page Views</span>
          </div>
        </div>

        <div className="dashboard-stat-card">
          <div className="stat-icon">
            <Article size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats?.uniqueVisitors ?? 0}</span>
            <span className="stat-label">Unique Visitors</span>
          </div>
        </div>

        <div className="dashboard-stat-card">
          <div className="stat-icon">
            <Files size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats?.publishedPosts ?? 0}</span>
            <span className="stat-label">Published Posts</span>
          </div>
        </div>
      </div>

      {stats?.activeByPath && stats.activeByPath.length > 0 && (
        <div className="dashboard-stats-active">
          <h3>Active Now</h3>
          <div className="active-paths-list">
            {stats.activeByPath.slice(0, 5).map((item) => (
              <div key={item.path} className="active-path-item">
                <span className="path">{item.path}</span>
                <span className="count">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {stats?.pageStats && stats.pageStats.length > 0 && (
        <div className="dashboard-stats-pages">
          <h3>Top Pages</h3>
          <div className="dashboard-list-table">
            <div className="dashboard-list-table-header">
              <span className="col-title">Page</span>
              <span className="col-views">Views</span>
            </div>
            {stats.pageStats.slice(0, 10).map((page) => (
              <div key={page.path} className="dashboard-list-row">
                <div className="col-title">
                  <span className="post-title">{page.title}</span>
                  <span className="post-slug">{page.path}</span>
                </div>
                <div className="col-views">{page.views}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="dashboard-stats-link">
        <Link to="/stats" className="dashboard-placeholder-link">
          Open Full Stats Page
        </Link>
      </div>
    </div>
  );
}

function SyncSection({
  showCommandModal,
  executeSync,
  syncOutput,
  syncRunning,
  syncServerAvailable,
  syncOutputRef,
  setSyncOutput,
}: {
  showCommandModal: (title: string, command: string, description?: string) => void;
  executeSync: (commandId: string, commandLabel: string) => Promise<void>;
  syncOutput: string;
  syncRunning: string | null;
  syncServerAvailable: boolean | null;
  syncOutputRef: React.RefObject<HTMLPreElement>;
  setSyncOutput: (output: string) => void;
}) {
  const syncCommands = [
    {
      id: "sync",
      label: "Sync (Dev)",
      command: "npm run sync",
      description: "Sync markdown to development Convex",
    },
    {
      id: "sync:prod",
      label: "Sync (Prod)",
      command: "npm run sync:prod",
      description: "Sync markdown to production Convex",
    },
    {
      id: "sync:discovery",
      label: "Sync Discovery (Dev)",
      command: "npm run sync:discovery",
      description: "Sync discovery files to dev",
    },
    {
      id: "sync:discovery:prod",
      label: "Sync Discovery (Prod)",
      command: "npm run sync:discovery:prod",
      description: "Sync discovery files to prod",
    },
    {
      id: "sync:all",
      label: "Sync All (Dev)",
      command: "npm run sync:all",
      description: "Sync everything to development",
    },
    {
      id: "sync:all:prod",
      label: "Sync All (Prod)",
      command: "npm run sync:all:prod",
      description: "Sync everything to production",
    },
  ];

  const handleCopyCommand = (label: string, command: string, description: string) => {
    showCommandModal(label, command, description);
  };

  const handleExecute = (commandId: string, label: string) => {
    executeSync(commandId, label);
  };

  // State for copy feedback on sync-server command
  const [copiedSyncServer, setCopiedSyncServer] = useState(false);

  const handleCopySyncServer = async () => {
    try {
      await navigator.clipboard.writeText("npm run sync-server");
      setCopiedSyncServer(true);
      setTimeout(() => setCopiedSyncServer(false), 2000);
    } catch {
      // Fallback: show modal
      showCommandModal(
        "Start Sync Server",
        "npm run sync-server",
        "Start the local sync server to enable execute buttons"
      );
    }
  };

  return (
    <div className="dashboard-sync-section">
      <div className="dashboard-sync-header">
        <ArrowsClockwise size={32} weight="light" />
        <h2>Sync Content</h2>
        <p>Sync markdown content to Convex database</p>
      </div>

      {/* Server Status */}
      <div className={`sync-server-status ${syncServerAvailable ? "online" : "offline"}`}>
        <div className="status-indicator">
          <span className={`status-dot ${syncServerAvailable ? "online" : "offline"}`} />
          <span className="status-text">
            Sync Server:{" "}
            {syncServerAvailable === null
              ? "Checking..."
              : syncServerAvailable
                ? "Online"
                : "Offline"}
          </span>
        </div>
        {!syncServerAvailable && syncServerAvailable !== null && (
          <div className="status-help">
            <Terminal size={14} />
            <code>npm run sync-server</code>
            <button
              className="copy-sync-server-btn"
              onClick={handleCopySyncServer}
              title="Copy command">
              {copiedSyncServer ? <Check size={12} /> : <CopySimple size={12} />}
            </button>
            <span>to enable execute buttons</span>
          </div>
        )}
      </div>

      <div className="dashboard-sync-grid">
        {syncCommands.map((cmd) => (
          <div key={cmd.id} className="dashboard-sync-card">
            <div className="sync-card-header">
              <h3>{cmd.label}</h3>
              <span className={`sync-status ${syncRunning === cmd.id ? "running" : "idle"}`}>
                {syncRunning === cmd.id && "Running..."}
              </span>
            </div>
            <p>{cmd.description}</p>
            <code className="sync-command">{cmd.command}</code>
            <div className="sync-card-buttons">
              <button
                className="dashboard-sync-card-btn copy"
                onClick={() => handleCopyCommand(cmd.label, cmd.command, cmd.description)}
                title="Copy command to clipboard">
                <CopySimple size={16} />
                <span>Copy</span>
              </button>
              <button
                className={`dashboard-sync-card-btn execute ${!syncServerAvailable ? "disabled" : ""}`}
                onClick={() => handleExecute(cmd.id, cmd.label)}
                disabled={!syncServerAvailable || syncRunning !== null}
                title={syncServerAvailable ? "Execute command" : "Start sync-server first"}>
                <ArrowsClockwise size={16} className={syncRunning === cmd.id ? "spinning" : ""} />
                <span>{syncRunning === cmd.id ? "Running..." : "Execute"}</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Terminal Output */}
      {(syncOutput || syncRunning) && (
        <div className="sync-terminal">
          <div className="sync-terminal-header">
            <Terminal size={16} />
            <span>Output</span>
            {syncOutput && !syncRunning && (
              <button
                className="sync-terminal-clear"
                onClick={() => setSyncOutput("")}
                title="Clear output">
                <X size={14} />
              </button>
            )}
          </div>
          <pre className="sync-terminal-output" ref={syncOutputRef}>
            {syncOutput || "Waiting for output..."}
          </pre>
        </div>
      )}

      <div className="dashboard-sync-info">
        <h3>Usage</h3>
        <p>
          {syncServerAvailable ? (
            <>
              Click <strong>Execute</strong> to run commands directly from the dashboard, or{" "}
              <strong>Copy</strong> to copy the command for your terminal.
            </>
          ) : (
            <>
              Start the sync server with{" "}
              <code className="copyable-code">
                npm run sync-server
                <button
                  className="inline-copy-btn"
                  onClick={handleCopySyncServer}
                  title="Copy command">
                  {copiedSyncServer ? <Check size={10} /> : <CopySimple size={10} />}
                </button>
              </code>{" "}
              to enable execute buttons, or use <strong>Copy</strong> to run commands manually in
              your terminal.
            </>
          )}
        </p>
      </div>
    </div>
  );
}
