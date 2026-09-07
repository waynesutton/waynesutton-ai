import type { HomepageHighlightsConfig } from "../../config/siteConfig";

type PublishedProject = { slug: string; title: string };
type PublishedPost = { slug: string; title: string };

interface HomepageHighlightsFieldsProps {
  config: HomepageHighlightsConfig;
  onChange: (next: Partial<HomepageHighlightsConfig>) => void;
  projects: Array<PublishedProject> | undefined;
  posts: Array<PublishedPost> | undefined;
}

/**
 * Controlled highlights fields: spotlight post first, projects second, matching
 * the order `HomepageHighlights` renders them on `/`. Owns no state and no
 * Save; the Homepage section folds it into its single Save. "Spotlight" is one
 * hand picked post, distinct from the featured list built from `featured: true`.
 */
export function HomepageHighlightsFields({
  config,
  onChange,
  projects,
  posts,
}: HomepageHighlightsFieldsProps) {
  const selectedCount = projects
    ? projects.filter((p) => config.projectSlugs.includes(p.slug)).length
    : config.projectSlugs.length;

  return (
    <>
      <div className="config-field checkbox">
        <label>
          <input
            type="checkbox"
            checked={config.postEnabled}
            onChange={(e) => onChange({ postEnabled: e.target.checked })}
          />
          <span>Show a spotlight post</span>
        </label>
      </div>
      {config.postEnabled && (
        <div className="home-highlight-group">
          <div className="config-field">
            <label htmlFor="home-featured-post">Spotlight post</label>
            <select
              id="home-featured-post"
              value={config.postSlug}
              onChange={(e) => onChange({ postSlug: e.target.value })}
            >
              <option value="">Select a published post</option>
              {posts?.map((post) => (
                <option key={post.slug} value={post.slug}>
                  {post.title}
                </option>
              ))}
            </select>
          </div>
          <div className="config-field">
            <label htmlFor="home-featured-post-position">Position</label>
            <select
              id="home-featured-post-position"
              value={config.postPosition}
              onChange={(e) =>
                onChange({
                  postPosition:
                    e.target.value === "below-posts" ? "below-posts" : "above-posts",
                })
              }
            >
              <option value="above-posts">Above the post list</option>
              <option value="below-posts">Below the post list</option>
            </select>
          </div>
          <div className="config-field checkbox">
            <label>
              <input
                type="checkbox"
                checked={config.postThumbnail}
                onChange={(e) => onChange({ postThumbnail: e.target.checked })}
              />
              <span>Show the post image</span>
            </label>
          </div>
        </div>
      )}

      <div className="config-field checkbox">
        <label>
          <input
            type="checkbox"
            checked={config.projectsEnabled}
            onChange={(e) => onChange({ projectsEnabled: e.target.checked })}
          />
          <span>Show selected projects</span>
        </label>
      </div>
      {config.projectsEnabled && (
        <div className="home-highlight-group">
          <div className="config-field">
            <label htmlFor="home-projects-title">Projects heading</label>
            <input
              id="home-projects-title"
              type="text"
              value={config.projectsTitle}
              placeholder="Projects"
              onChange={(e) => onChange({ projectsTitle: e.target.value })}
            />
          </div>
          <fieldset className="home-highlight-picker">
            <legend>
              <span>Projects</span>
              {projects && projects.length > 0 ? (
                <span className="home-highlight-picker-count">
                  {selectedCount} of {projects.length} selected
                </span>
              ) : null}
            </legend>
            {projects === undefined ? (
              <p className="config-field-note">Loading projects...</p>
            ) : projects.length === 0 ? (
              <p className="config-field-note">Publish a project to select it here.</p>
            ) : (
              <ul className="home-highlight-picker-list">
                {projects.map((project) => (
                  <li key={project.slug}>
                    <label>
                      <input
                        type="checkbox"
                        checked={config.projectSlugs.includes(project.slug)}
                        onChange={(e) =>
                          onChange({
                            projectSlugs: e.target.checked
                              ? [...config.projectSlugs, project.slug]
                              : config.projectSlugs.filter(
                                  (slug) => slug !== project.slug,
                                ),
                          })
                        }
                      />
                      <span>{project.title}</span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </fieldset>
          <div className="config-field">
            <label htmlFor="home-projects-position">Position</label>
            <select
              id="home-projects-position"
              value={config.projectsPosition}
              onChange={(e) =>
                onChange({
                  projectsPosition:
                    e.target.value === "above-posts" ? "above-posts" : "below-posts",
                })
              }
            >
              <option value="above-posts">Above the post list</option>
              <option value="below-posts">Below the post list</option>
            </select>
          </div>
          <div className="config-field checkbox">
            <label>
              <input
                type="checkbox"
                checked={config.projectsThumbnails}
                onChange={(e) => onChange({ projectsThumbnails: e.target.checked })}
              />
              <span>Show project thumbnails</span>
            </label>
          </div>
        </div>
      )}
    </>
  );
}
