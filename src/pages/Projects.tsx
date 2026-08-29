import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { GithubLogo, XLogo, LinkedinLogo, ArrowUpRight } from "@phosphor-icons/react";
import { api } from "../../convex/_generated/api";
import Footer from "../components/Footer";
import SocialFooter from "../components/SocialFooter";
import siteConfig from "../config/siteConfig";

const PROJECTS_VIEW_MODE_KEY = "projects-view-mode";

type ProjectsViewMode = "list" | "one-column" | "two-column";

const VIEW_MODES: ProjectsViewMode[] = ["list", "one-column", "two-column"];

function isViewMode(value: string | null): value is ProjectsViewMode {
  return value !== null && VIEW_MODES.includes(value as ProjectsViewMode);
}

type Project = {
  slug: string;
  title: string;
  description: string;
  thumbnail?: string;
  url?: string;
  repoUrl?: string;
  xUrl?: string;
  linkedinUrl?: string;
};

// The rail always renders every glyph. A link that does not exist stays dimmed
// and unclickable instead of disappearing, so a missing repo reads as "not open
// source" rather than as a gap in the layout.
const RAIL_LINKS = [
  { key: "xUrl", Icon: XLogo, label: "on X" },
  { key: "repoUrl", Icon: GithubLogo, label: "source on GitHub" },
  { key: "linkedinUrl", Icon: LinkedinLogo, label: "on LinkedIn" },
] as const;

function ProjectLinkRail({ project }: { project: Project }) {
  return (
    <div className="project-rail">
      {RAIL_LINKS.map(({ key, Icon, label }) => {
        const href = project[key];
        if (!href) {
          return (
            <span
              key={key}
              className="project-rail-icon project-rail-icon-empty"
              aria-hidden="true"
            >
              <Icon size={18} weight="regular" />
            </span>
          );
        }
        return (
          <a
            key={key}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="project-rail-icon"
            aria-label={`${project.title} ${label}`}
          >
            <Icon size={18} weight="regular" />
          </a>
        );
      })}
    </div>
  );
}

function ProjectTitle({ project }: { project: Project }) {
  if (!project.url) {
    return <h2 className="project-title">{project.title}</h2>;
  }
  return (
    <h2 className="project-title">
      <a
        href={project.url}
        target="_blank"
        rel="noopener noreferrer"
        className="project-title-link"
      >
        {project.title}
        <ArrowUpRight size={14} weight="bold" className="project-title-arrow" />
      </a>
    </h2>
  );
}

function ProjectThumbnail({ project }: { project: Project }) {
  if (!project.thumbnail) return null;
  return (
    <div className="project-thumbnail">
      <img src={project.thumbnail} alt="" loading="lazy" />
    </div>
  );
}

function ProjectCard({
  project,
  viewMode,
}: {
  project: Project;
  viewMode: ProjectsViewMode;
}) {
  return (
    <article className="project-card">
      {viewMode !== "list" && <ProjectThumbnail project={project} />}
      <div className="project-body">
        <ProjectTitle project={project} />
        <p className="project-description">{project.description}</p>
        <ProjectLinkRail project={project} />
      </div>
    </article>
  );
}

// Projects index: a flat, scannable list of shipped work. Projects have no
// detail page, so the only clickable targets are the title and the link rail.
export default function Projects() {
  const projects = useQuery(api.projects.listPublished);
  const footerPage = useQuery(api.pages.getPageBySlug, { slug: "footer" });

  const [viewMode, setViewMode] = useState<ProjectsViewMode>(
    siteConfig.projectsPage.viewMode,
  );

  // Restore the saved layout only when the toggle is visible; with the control
  // hidden, the config default always wins.
  useEffect(() => {
    if (!siteConfig.projectsPage.showViewToggle) return;
    const saved = localStorage.getItem(PROJECTS_VIEW_MODE_KEY);
    if (isViewMode(saved)) {
      setViewMode(saved);
    }
  }, []);

  const selectViewMode = (mode: ProjectsViewMode) => {
    setViewMode(mode);
    localStorage.setItem(PROJECTS_VIEW_MODE_KEY, mode);
  };

  const showFooter =
    siteConfig.footer.enabled && siteConfig.footer.showOnBlogPage;

  return (
    <div className={`projects-page projects-page-${viewMode}`}>
      <header className="projects-header">
        <div className="projects-header-top">
          <div>
            <h1 className="projects-title">{siteConfig.projectsPage.title}</h1>
            {siteConfig.projectsPage.description && (
              <p className="projects-description">
                {siteConfig.projectsPage.description}
              </p>
            )}
          </div>
          {siteConfig.projectsPage.showViewToggle &&
            projects !== undefined &&
            projects.length > 0 && (
              <div
                className="projects-view-toggle"
                role="group"
                aria-label="Project layout"
              >
                <button
                  type="button"
                  className="projects-view-option"
                  aria-pressed={viewMode === "list"}
                  aria-label="List layout"
                  data-tooltip="List"
                  onClick={() => selectViewMode("list")}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <line x1="4" y1="7" x2="20" y2="7" />
                    <line x1="4" y1="12" x2="20" y2="12" />
                    <line x1="4" y1="17" x2="20" y2="17" />
                  </svg>
                </button>
                <button
                  type="button"
                  className="projects-view-option"
                  aria-pressed={viewMode === "one-column"}
                  aria-label="One column layout"
                  data-tooltip="One column"
                  onClick={() => selectViewMode("one-column")}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect x="4" y="4" width="16" height="7" rx="1" />
                    <rect x="4" y="13" width="16" height="7" rx="1" />
                  </svg>
                </button>
                <button
                  type="button"
                  className="projects-view-option"
                  aria-pressed={viewMode === "two-column"}
                  aria-label="Two column layout"
                  data-tooltip="Two columns"
                  onClick={() => selectViewMode("two-column")}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect x="4" y="4" width="7" height="16" rx="1" />
                    <rect x="13" y="4" width="7" height="16" rx="1" />
                  </svg>
                </button>
              </div>
            )}
        </div>
      </header>

      {projects === undefined ? null : projects.length === 0 ? (
        <p className="projects-empty">
          No projects yet. Add the first one from the dashboard.
        </p>
      ) : (
        <div className="projects-grid">
          {projects.map((project) => (
            <ProjectCard
              key={project.slug}
              project={project}
              viewMode={viewMode}
            />
          ))}
        </div>
      )}

      {showFooter && <Footer content={footerPage?.content} />}

      {siteConfig.socialFooter?.enabled &&
        siteConfig.socialFooter.showOnBlogPage && <SocialFooter />}
    </div>
  );
}
