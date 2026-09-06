import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { HomepageHighlightsConfig } from "../../config/siteConfig";
import { resolveHomepageHighlights } from "../../utils/homepageHighlights";

type PublishedProject = { slug: string; title: string };
type PublishedPost = { slug: string; title: string };

interface HomepageHighlightsFieldsProps {
  config: HomepageHighlightsConfig;
  onChange: (next: Partial<HomepageHighlightsConfig>) => void;
  projects: Array<PublishedProject> | undefined;
  posts: Array<PublishedPost> | undefined;
}

/**
 * Controlled highlights fields: featured post first, projects second, matching
 * the order `HomepageHighlights` renders them on `/`. Owns no state and no
 * Save, so the Homepage section can fold it into one save while Site Config
 * keeps the standalone card below.
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
          <span>Show a featured post</span>
        </label>
      </div>
      {config.postEnabled && (
        <div className="home-highlight-group">
          <div className="config-field">
            <label htmlFor="home-featured-post">Featured post</label>
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

/**
 * Standalone card for Site Config. Hydrates once from the live overrides and
 * saves its own key. The Homepage section does not use this wrapper; it lifts
 * the same fields into its single Save.
 */
export function HomepageHighlightsSettings() {
  const saved = useQuery(api.siteConfigData.getOverrides);
  const projects = useQuery(api.projects.listPublished);
  const posts = useQuery(api.posts.getAllPosts);
  const save = useMutation(api.siteConfigData.savePartialOverrides);
  const [config, setConfig] = useState<HomepageHighlightsConfig>(() =>
    resolveHomepageHighlights(undefined),
  );
  const [hydrated, setHydrated] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (saved === undefined || hydrated) return;
    setConfig(resolveHomepageHighlights(saved?.homepageHighlights));
    setHydrated(true);
  }, [saved, hydrated]);

  return (
    <div className="dashboard-config-card">
      <h3>Homepage highlights</h3>
      <p className="config-field-note">
        A featured post and selected projects on the default homepage. Empty or
        unpublished selections stay hidden. This card has its own Save.
      </p>
      <HomepageHighlightsFields
        config={config}
        onChange={(next) => setConfig((value) => ({ ...value, ...next }))}
        projects={projects}
        posts={posts}
      />
      <button
        type="button"
        className="dashboard-action-btn primary"
        disabled={saving || !hydrated}
        aria-busy={saving}
        onClick={async () => {
          setSaving(true);
          setMessage("");
          try {
            await save({ overrides: { homepageHighlights: config } });
            setMessage("Highlights saved.");
          } catch {
            setMessage("Could not save highlights. Try again.");
          } finally {
            setSaving(false);
          }
        }}
      >
        {saving ? "Saving..." : "Save highlights"}
      </button>
      {/* Always mounted so the live region announces; empty collapses via :empty */}
      <p role="status" className="config-field-note home-highlight-status">
        {message}
      </p>
    </div>
  );
}
