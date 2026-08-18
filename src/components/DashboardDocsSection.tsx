import { useState } from "react";
import {
  BookOpen,
  PenNib,
  Sparkle,
  Key,
  EnvelopeSimple,
  Robot,
  Plug,
  Broadcast,
  PaintBrush,
  RocketLaunch,
  XLogo,
  Gear,
  Database,
  Copy,
  Check,
  PaperPlaneTilt,
} from "@phosphor-icons/react";
import BlogPost from "./BlogPost";
import { DOCS_TOPICS } from "./dashboard/docsTopics";

const DOCS_TOPIC_STORAGE = "dashboard-docs-topic";

const TOPIC_ICONS: Record<string, React.ReactNode> = {
  overview: <BookOpen size={16} />,
  publish: <PaperPlaneTilt size={16} />,
  writing: <PenNib size={16} />,
  agents: <Robot size={16} />,
  mcp: <Plug size={16} />,
  "api-keys": <Key size={16} />,
  newsletter: <EnvelopeSimple size={16} />,
  "ai-features": <Sparkle size={16} />,
  "agent-ready": <Broadcast size={16} />,
  "x-integration": <XLogo size={16} />,
  themes: <PaintBrush size={16} />,
  config: <Gear size={16} />,
  "site-ops": <Database size={16} />,
  deploying: <RocketLaunch size={16} />,
};

function readStoredTopic(): string {
  try {
    const stored = sessionStorage.getItem(DOCS_TOPIC_STORAGE);
    if (stored && DOCS_TOPICS.some((t) => t.id === stored)) {
      return stored;
    }
  } catch {
    // sessionStorage can throw in private mode
  }
  return DOCS_TOPICS[0].id;
}

export default function DashboardDocsSection() {
  const [activeTopic, setActiveTopic] = useState<string>(readStoredTopic);
  const [copied, setCopied] = useState(false);
  const topic = DOCS_TOPICS.find((t) => t.id === activeTopic) ?? DOCS_TOPICS[0];

  const selectTopic = (id: string) => {
    setActiveTopic(id);
    setCopied(false);
    try {
      sessionStorage.setItem(DOCS_TOPIC_STORAGE, id);
    } catch {
      // ignore
    }
  };

  const copyMarkdown = async () => {
    try {
      await navigator.clipboard.writeText(topic.content);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="dashboard-docs">
      <a className="dashboard-docs-skip" href="#dashboard-docs-content">
        Skip to docs content
      </a>
      <nav className="dashboard-docs-nav" aria-label="Documentation topics">
        {DOCS_TOPICS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`dashboard-docs-nav-item ${t.id === activeTopic ? "active" : ""}`}
            onClick={() => selectTopic(t.id)}
            aria-current={t.id === activeTopic ? "page" : undefined}>
            {TOPIC_ICONS[t.id]}
            <span>{t.title}</span>
          </button>
        ))}
      </nav>
      <div className="dashboard-docs-toolbar">
        <p className="dashboard-docs-toolbar-hint">
          Copy as markdown and paste into Cursor, Claude Code, or Codex.
        </p>
        <button
          type="button"
          className="dashboard-action-btn"
          onClick={() => void copyMarkdown()}
          aria-label={`Copy ${topic.title} as markdown`}>
          {copied ? <Check size={16} /> : <Copy size={16} />}
          {copied ? "Copied" : "Copy markdown"}
        </button>
      </div>
      <div
        id="dashboard-docs-content"
        className="dashboard-docs-content"
        tabIndex={-1}>
        <BlogPost content={topic.content} slug="dashboard-docs" pageType="page" />
      </div>
    </div>
  );
}
