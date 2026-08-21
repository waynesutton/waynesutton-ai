import { useEffect, useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import Footer from "../components/Footer";
import SocialFooter from "../components/SocialFooter";
import siteConfig from "../config/siteConfig";

const PROJECTS_VIEW_MODE_KEY = "projects-view-mode";

type ProjectKind = "project" | "craft";
type GalleryView = "list" | "thumbs";

function ViewToggleButton({
  viewMode,
  onToggle,
}: {
  viewMode: GalleryView;
  onToggle: () => void;
}) {
  return (
    <button
      className="view-toggle-button"
      onClick={onToggle}
      aria-label={`Switch to ${viewMode === "list" ? "thumbnail" : "list"} view`}
      data-tooltip={`Switch to ${viewMode === "list" ? "thumbnail" : "list"} view`}
    >
      {viewMode === "list" ? (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
        </svg>
      ) : (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="8" y1="6" x2="21" y2="6" />
          <line x1="8" y1="12" x2="21" y2="12" />
          <line x1="8" y1="18" x2="21" y2="18" />
          <line x1="3" y1="6" x2="3.01" y2="6" />
          <line x1="3" y1="12" x2="3.01" y2="12" />
          <line x1="3" y1="18" x2="3.01" y2="18" />
        </svg>
      )}
    </button>
  );
}

function ProjectCard({
  title,
  description,
  url,
  image,
  tags,
  viewMode,
}: {
  title: string;
  description: string;
  url?: string;
  image?: string;
  tags: string[];
  viewMode: GalleryView;
}) {
  const media = image ? (
    <img src={image} alt={title} className="project-card-image" />
  ) : (
    <div className="project-card-image project-card-image-empty" aria-hidden="true" />
  );

  const body = (
    <>
      {media}
      <div className="project-card-body">
        <h2 className="project-card-title">{title}</h2>
        {description && <p className="project-card-description">{description}</p>}
        {tags.length > 0 && (
          <p className="project-card-tags">{tags.join(" · ")}</p>
        )}
      </div>
    </>
  );

  if (url) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={`project-card project-card-${viewMode}`}
      >
        {body}
      </a>
    );
  }

  return <article className={`project-card project-card-${viewMode}`}>{body}</article>;
}

export default function Projects({ kind }: { kind: ProjectKind }) {
  const [tag, setTag] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<GalleryView>(
    siteConfig.projectsPage.defaultView,
  );

  const gallery = useQuery(api.projects.listPublished, {
    kind,
    ...(tag ? { tag } : {}),
  });
  const footerPage = useQuery(api.pages.getPageBySlug, { slug: "footer" });

  useEffect(() => {
    if (!siteConfig.projectsPage.showViewToggle) return;
    const saved = localStorage.getItem(PROJECTS_VIEW_MODE_KEY);
    if (saved === "list" || saved === "thumbs") {
      setViewMode(saved);
    }
  }, []);

  const toggleViewMode = () => {
    const next = viewMode === "list" ? "thumbs" : "list";
    setViewMode(next);
    localStorage.setItem(PROJECTS_VIEW_MODE_KEY, next);
  };

  const title =
    kind === "craft" ? "Craft" : siteConfig.projectsPage.title;
  const items = gallery?.items ?? [];
  const tags = useMemo(() => gallery?.tags ?? [], [gallery?.tags]);

  const showFooter =
    siteConfig.footer.enabled &&
    (siteConfig.footer.showOnProjects ?? siteConfig.footer.showOnPages);
  const showSocial =
    siteConfig.socialFooter?.enabled &&
    (siteConfig.socialFooter.showOnProjects ??
      siteConfig.socialFooter.showOnPages);

  return (
    <div className={`projects-page projects-page-${viewMode}`}>
      <header className="blog-header">
        <div className="blog-header-top">
          <div>
            <h1 className="blog-title">{title}</h1>
            {kind === "project" && (
              <p className="blog-description">
                Selected work. Live preview opens the outbound url.
              </p>
            )}
          </div>
          {siteConfig.projectsPage.showViewToggle &&
            gallery !== undefined &&
            items.length > 0 && (
              <ViewToggleButton viewMode={viewMode} onToggle={toggleViewMode} />
            )}
        </div>
      </header>

      {tags.length > 0 && (
        <div className="project-tag-filter" role="tablist" aria-label="Filter by tag">
          <button
            type="button"
            className={`project-tag-chip${!tag ? " is-active" : ""}`}
            onClick={() => setTag(null)}
          >
            All
          </button>
          {tags.map((item) => (
            <button
              key={item}
              type="button"
              className={`project-tag-chip${tag === item ? " is-active" : ""}`}
              onClick={() => setTag(item === tag ? null : item)}
            >
              {item}
            </button>
          ))}
        </div>
      )}

      <section className={`projects-grid projects-grid-${viewMode}`}>
        {gallery === undefined ? null : items.length === 0 ? (
          <p className="no-posts">
            {kind === "craft"
              ? "No craft items yet."
              : "No projects yet."}
          </p>
        ) : (
          items.map((item) => (
            <ProjectCard
              key={item._id}
              title={item.title}
              description={item.description}
              url={item.url}
              image={item.image}
              tags={item.tags}
              viewMode={viewMode}
            />
          ))
        )}
      </section>

      {showFooter && <Footer content={footerPage?.content} />}
      {showSocial && <SocialFooter />}
    </div>
  );
}
