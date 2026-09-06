import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  GitBranch,
  Copy,
  Check,
  Code,
  PaperPlaneTilt,
  ArrowLeft,
  MagnifyingGlass,
  Browser,
  PuzzlePiece,
} from "@phosphor-icons/react";
import BlogPost from "./BlogPost";
import { DOCS_TOPICS } from "./dashboard/docsTopics";
import { interpolateDocsContent } from "../utils/deployments";

const DOCS_TOPIC_STORAGE = "dashboard-docs-topic";

// Matches the docs split breakpoint in dashboard-forms.css
const DOCS_MOBILE_QUERY = "(max-width: 900px)";

const TOPIC_ICONS: Record<string, React.ReactNode> = {
  overview: <BookOpen size={16} />,
  publish: <PaperPlaneTilt size={16} />,
  writing: <PenNib size={16} />,
  embeds: <Code size={16} />,
  agents: <Robot size={16} />,
  mcp: <Plug size={16} />,
  webmcp: <Browser size={16} />,
  "api-keys": <Key size={16} />,
  newsletter: <EnvelopeSimple size={16} />,
  "ai-features": <Sparkle size={16} />,
  "agent-ready": <Broadcast size={16} />,
  "x-integration": <XLogo size={16} />,
  themes: <PaintBrush size={16} />,
  config: <Gear size={16} />,
  "site-ops": <Database size={16} />,
  skills: <PuzzlePiece size={16} />,
  "git-guide": <GitBranch size={16} />,
  deploying: <RocketLaunch size={16} />,
};

// Sidebar grouping. Lives here rather than in docsTopics.ts so the topic file
// stays pure content. Any topic missing from a group still shows, under "More".
const TOPIC_GROUPS: Array<{ title: string; topicIds: Array<string> }> = [
  { title: "Getting started", topicIds: ["overview", "writing", "embeds", "skills"] },
  {
    title: "Agents and automation",
    topicIds: ["publish", "agents", "mcp", "webmcp", "agent-ready"],
  },
  {
    title: "Integrations",
    topicIds: ["api-keys", "newsletter", "x-integration", "ai-features"],
  },
  { title: "Appearance", topicIds: ["themes", "config"] },
  { title: "Operations", topicIds: ["git-guide", "site-ops", "deploying"] },
];

function readStoredTopic(): string {
  // A `?docs=<id>` param wins so a topic can be linked, then remembered
  try {
    const fromUrl = new URLSearchParams(window.location.search).get("docs");
    if (fromUrl && DOCS_TOPICS.some((t) => t.id === fromUrl)) {
      return fromUrl;
    }
  } catch {
    // URLSearchParams can throw on malformed queries
  }
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

function writeTopicToUrl(id: string): void {
  try {
    const params = new URLSearchParams(window.location.search);
    params.set("docs", id);
    window.history.replaceState({}, "", `${window.location.pathname}?${params}`);
  } catch {
    // ignore, the sessionStorage copy still holds
  }
}

interface DashboardDocsSectionProps {
  /** Topic id pushed from the dashboard search palette */
  requestedTopic?: string | null;
  /** Called once the requested topic has been opened */
  onTopicConsumed?: () => void;
}

export default function DashboardDocsSection({
  requestedTopic = null,
  onTopicConsumed,
}: DashboardDocsSectionProps = {}) {
  const [activeTopic, setActiveTopic] = useState<string>(readStoredTopic);
  const [copied, setCopied] = useState(false);
  const [filter, setFilter] = useState("");
  // On phones the sidebar and the article share the screen, so the article only
  // shows once a topic is picked. Desktop always shows both.
  const [showContentOnMobile, setShowContentOnMobile] = useState(false);
  // The article pane holds its own scroll, so a new topic has to start at the top
  const contentRef = useRef<HTMLDivElement | null>(null);

  const topic = DOCS_TOPICS.find((t) => t.id === activeTopic) ?? DOCS_TOPICS[0];
  const renderedContent = useMemo(
    () => interpolateDocsContent(topic.content),
    [topic.content],
  );

  // Groups resolved against the real topic list, with anything ungrouped
  // appended so adding a topic can never make it unreachable
  const groups = useMemo(() => {
    const grouped = new Set(TOPIC_GROUPS.flatMap((g) => g.topicIds));
    const resolved = TOPIC_GROUPS.map((group) => ({
      title: group.title,
      topics: group.topicIds
        .map((id) => DOCS_TOPICS.find((t) => t.id === id))
        .filter((t): t is (typeof DOCS_TOPICS)[number] => t !== undefined),
    })).filter((group) => group.topics.length > 0);

    const leftovers = DOCS_TOPICS.filter((t) => !grouped.has(t.id));
    if (leftovers.length > 0) {
      resolved.push({ title: "More", topics: leftovers });
    }
    return resolved;
  }, []);

  const query = filter.trim().toLowerCase();
  const visibleGroups = useMemo(() => {
    if (!query) return groups;
    return groups
      .map((group) => ({
        title: group.title,
        topics: group.topics.filter((t) => t.title.toLowerCase().includes(query)),
      }))
      .filter((group) => group.topics.length > 0);
  }, [groups, query]);

  const selectTopic = useCallback((id: string) => {
    setActiveTopic(id);
    setCopied(false);
    setShowContentOnMobile(true);
    contentRef.current?.scrollTo({ top: 0 });
    writeTopicToUrl(id);
    try {
      sessionStorage.setItem(DOCS_TOPIC_STORAGE, id);
    } catch {
      // ignore
    }
  }, []);

  // Search results deep link into a topic even when docs is already mounted
  useEffect(() => {
    if (requestedTopic && DOCS_TOPICS.some((t) => t.id === requestedTopic)) {
      selectTopic(requestedTopic);
      onTopicConsumed?.();
    }
  }, [requestedTopic, selectTopic, onTopicConsumed]);

  // A linked `?docs=` param should open its article straight away on a phone
  useEffect(() => {
    try {
      if (new URLSearchParams(window.location.search).get("docs")) {
        setShowContentOnMobile(true);
      }
    } catch {
      // ignore
    }
  }, []);

  // Reset the phone pane when the viewport grows past the split breakpoint, so
  // going back to desktop never leaves the sidebar hidden
  useEffect(() => {
    const mq = window.matchMedia(DOCS_MOBILE_QUERY);
    const onChange = (e: MediaQueryListEvent) => {
      if (!e.matches) setShowContentOnMobile(false);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const copyMarkdown = async () => {
    try {
      await navigator.clipboard.writeText(renderedContent);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className={`dashboard-docs ${showContentOnMobile ? "has-selection" : ""}`}>
      <a className="dashboard-docs-skip" href="#dashboard-docs-content">
        Skip to docs content
      </a>

      <nav className="dashboard-docs-sidebar" aria-label="Documentation topics">
        <div className="dashboard-docs-search">
          <MagnifyingGlass size={16} />
          <input
            type="search"
            value={filter}
            placeholder="Filter topics"
            aria-label="Filter documentation topics"
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>

        {/* Own scroll region so the filter field above it stays in place */}
        <div className="dashboard-docs-topic-scroll">
          {visibleGroups.length === 0 ? (
            <p className="dashboard-docs-empty">No topics match that filter.</p>
          ) : (
            visibleGroups.map((group) => (
              <div key={group.title} className="dashboard-docs-group">
                <p className="dashboard-docs-group-title">{group.title}</p>
                <ul className="dashboard-docs-group-list">
                  {group.topics.map((t) => (
                    <li key={t.id}>
                      <button
                        type="button"
                        className={`dashboard-docs-nav-item ${
                          t.id === activeTopic ? "active" : ""
                        }`}
                        onClick={() => selectTopic(t.id)}
                        aria-current={t.id === activeTopic ? "page" : undefined}>
                        {TOPIC_ICONS[t.id]}
                        <span>{t.title}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </div>
      </nav>

      <div className="dashboard-docs-main">
        <div className="dashboard-docs-toolbar">
          <button
            type="button"
            className="dashboard-docs-back-btn"
            onClick={() => setShowContentOnMobile(false)}>
            <ArrowLeft size={16} />
            All topics
          </button>
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
          ref={contentRef}
          tabIndex={-1}>
          <BlogPost content={renderedContent} slug="dashboard-docs" pageType="page" />
        </div>
      </div>
    </div>
  );
}
