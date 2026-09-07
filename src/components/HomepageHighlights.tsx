import { Link } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { resolveHomepageHighlights } from "../utils/homepageHighlights";
import { ProjectCard } from "../pages/Projects";

export default function HomepageHighlights({
  position,
}: {
  position: "above-posts" | "below-posts";
}) {
  const overrides = useQuery(api.siteConfigData.getOverrides);
  const config = resolveHomepageHighlights(overrides?.homepageHighlights);
  const showProjects =
    config?.projectsEnabled && config.projectsPosition === position;
  const showPost = config?.postEnabled && config.postPosition === position;
  const projects = useQuery(
    api.projects.listPublished,
    showProjects ? {} : "skip",
  );
  const post = useQuery(
    api.posts.getPostBySlug,
    showPost && config?.postSlug ? { slug: config.postSlug } : "skip",
  );
  const selected =
    projects?.filter((project) =>
      config?.projectSlugs.includes(project.slug),
    ) ?? [];
  return (
    <>
      {showPost && post && !post.unlisted && (
        <section className="home-highlight" aria-label="Spotlight post">
          {config?.postThumbnail && post.image && (
            <Link to={`/${post.slug}`} tabIndex={-1} aria-hidden="true">
              <img
                className="home-highlight-image"
                src={post.image}
                alt=""
                loading="lazy"
              />
            </Link>
          )}
          <h2>
            <Link to={`/${post.slug}`}>{post.title}</Link>
          </h2>
          {post.description && <p>{post.description}</p>}
        </section>
      )}
      {showProjects && selected.length > 0 && (
        <section
          className={`home-highlight projects-page-${config?.projectsThumbnails ? "two-column" : "list"}`}
          aria-label={config?.projectsTitle || "Projects"}
        >
          {config?.projectsTitle && <h2>{config.projectsTitle}</h2>}
          <div className="projects-grid">
            {selected.map((project) => (
              <ProjectCard
                key={project.slug}
                project={project}
                viewMode={config?.projectsThumbnails ? "two-column" : "list"}
              />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
