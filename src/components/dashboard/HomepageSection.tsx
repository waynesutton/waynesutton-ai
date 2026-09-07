import { useState, useEffect, useMemo } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  ArrowUp,
  ArrowDown,
  Trash,
  Plus,
  Image as ImageIcon,
  FloppyDisk,
  SpinnerGap,
} from "@phosphor-icons/react";
import { HomepageHighlightsFields } from "./HomepageHighlightsSettings";
import { ImageUploadModal } from "../ImageUploadModal";
import siteConfig from "../../config/siteConfig";
import type {
  HomeCategorySection,
  HomeHeroImageConfig,
  HomeHeroLayout,
  HomeHeroSide,
  HomepageHighlightsConfig,
} from "../../config/siteConfig";
import { resolveHomeCategories } from "../../utils/homeCategories";
import { resolveHomepageHighlights } from "../../utils/homepageHighlights";
import { buildHomepageOrder } from "../../utils/homepageOrder";
import {
  resolveFeaturedList,
  resolveHomePostList,
  type FeaturedListConfig,
  type HomePostListConfig,
} from "../../utils/homePostList";
import { applyRuntimeConfigOverrides } from "../../config/runtimeConfig";

type ToastType = "success" | "error" | "info" | "warning";
type CategoriesPosition = "above-posts" | "below-posts";

const DEFAULT_HERO: HomeHeroImageConfig = {
  enabled: false,
  src: "",
  alt: "",
  href: "",
  layout: "banner",
  side: "right",
  position: "top",
  width: 100,
  rounded: true,
};

/**
 * Homepage dashboard section. Cards stack in the order the homepage renders
 * them (banner, featured list, highlights, category sections, post list) and a
 * sticky rail shows the resulting running order. One Save writes
 * homeHeroImage, the featured list keys, homepageHighlights, homeCategories,
 * and the homepage half of postsDisplay through savePartialOverrides, leaving
 * the rest of Site Config alone. Site Config owns /blog.
 */
export function HomepageSection({
  addToast,
}: {
  addToast: (message: string, type?: ToastType) => void;
}) {
  const [hero, setHero] = useState<HomeHeroImageConfig>(() => ({
    ...DEFAULT_HERO,
    ...(siteConfig.homeHeroImage ?? {}),
  }));
  const [featured, setFeatured] = useState<FeaturedListConfig>(() =>
    resolveFeaturedList(undefined),
  );
  const [postList, setPostList] = useState<HomePostListConfig>(() =>
    resolveHomePostList(undefined),
  );
  const [highlights, setHighlights] = useState<HomepageHighlightsConfig>(() =>
    resolveHomepageHighlights(undefined),
  );
  const [categoriesEnabled, setCategoriesEnabled] = useState(
    siteConfig.homeCategories?.enabled === true,
  );
  const [categoriesPosition, setCategoriesPosition] =
    useState<CategoriesPosition>(
      siteConfig.homeCategories?.position ?? "above-posts",
    );
  const [sections, setSections] = useState<Array<HomeCategorySection>>(() =>
    (siteConfig.homeCategories?.sections ?? []).map((section) => ({
      ...section,
    })),
  );
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  // JSON of the last hydrated or saved state, so the rail can say Unsaved changes
  const [savedSnapshot, setSavedSnapshot] = useState<string | null>(null);

  const savePartialOverrides = useMutation(
    api.siteConfigData.savePartialOverrides,
  );
  const publishedTags = useQuery(api.posts.getAllTags);
  const publishedProjects = useQuery(api.projects.listPublished);
  const publishedPosts = useQuery(api.posts.getAllPosts);
  const featuredPages = useQuery(api.pages.getFeaturedPages);
  const configOverrides = useQuery(api.siteConfigData.getOverrides);

  const currentState = useMemo(
    () => ({
      hero,
      featured,
      highlights,
      categories: {
        enabled: categoriesEnabled,
        position: categoriesPosition,
        sections,
      },
      postList,
    }),
    [hero, featured, highlights, categoriesEnabled, categoriesPosition, sections, postList],
  );
  const currentSnapshot = JSON.stringify(currentState);
  const dirty = hydrated && savedSnapshot !== null && savedSnapshot !== currentSnapshot;

  // Seed from live overrides once so a reload shows the last Save, not the file
  useEffect(() => {
    if (hydrated || configOverrides === undefined) return;
    const resolved = resolveHomeCategories(configOverrides);
    const nextSections = resolved.sections.map((section) => ({ ...section }));
    const nextHighlights = resolveHomepageHighlights(
      configOverrides?.homepageHighlights,
    );
    const nextFeatured = resolveFeaturedList(configOverrides);
    const nextPostList = resolveHomePostList(configOverrides);
    const savedHero = configOverrides?.homeHeroImage;
    const nextHero: HomeHeroImageConfig = {
      ...DEFAULT_HERO,
      ...(siteConfig.homeHeroImage ?? {}),
      ...(savedHero && typeof savedHero === "object" && !Array.isArray(savedHero)
        ? (savedHero as Partial<HomeHeroImageConfig>)
        : {}),
    };
    setCategoriesEnabled(resolved.enabled);
    setCategoriesPosition(resolved.position);
    setSections(nextSections);
    setHighlights(nextHighlights);
    setFeatured(nextFeatured);
    setPostList(nextPostList);
    setHero(nextHero);
    setSavedSnapshot(
      JSON.stringify({
        hero: nextHero,
        featured: nextFeatured,
        highlights: nextHighlights,
        categories: {
          enabled: resolved.enabled,
          position: resolved.position,
          sections: nextSections,
        },
        postList: nextPostList,
      }),
    );
    setHydrated(true);
  }, [configOverrides, hydrated]);

  // Published items marked featured: true, for the rail count
  const featuredCount =
    publishedPosts === undefined || featuredPages === undefined
      ? undefined
      : publishedPosts.filter((p) => p.featured).length + featuredPages.length;

  // Running order derived from the form, with live publish data when loaded
  const order = useMemo(() => {
    const tagCounts: Record<string, number> | undefined = publishedTags
      ? Object.fromEntries(
          publishedTags.map((entry) => [entry.tag.toLowerCase(), entry.count]),
        )
      : undefined;
    return buildHomepageOrder({
      hero,
      highlights,
      categories: currentState.categories,
      showPostList: postList.enabled,
      featuredList: { enabled: featured.enabled, count: featuredCount },
      publishedProjectSlugs: publishedProjects?.map((p) => p.slug),
      publishedPostSlugs: publishedPosts?.map((p) => p.slug),
      tagCounts,
    });
  }, [
    hero,
    highlights,
    currentState.categories,
    postList.enabled,
    featured.enabled,
    featuredCount,
    publishedTags,
    publishedProjects,
    publishedPosts,
  ]);

  const updateSection = (
    index: number,
    patch: Partial<HomeCategorySection>,
  ) => {
    setSections((current) =>
      current.map((section, i) =>
        i === index ? { ...section, ...patch } : section,
      ),
    );
  };

  const moveSection = (index: number, direction: -1 | 1) => {
    setSections((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      // Drop rows with no tag so an unfinished section never ships an empty heading
      const cleanSections = sections
        .filter((section) => section.tag.trim().length > 0)
        .map((section) => ({
          title: section.title.trim() || section.tag.trim(),
          tag: section.tag.trim(),
          limit: section.limit && section.limit > 0 ? section.limit : undefined,
          columns: section.columns ?? 2,
          showDate: section.showDate === true,
          showOnHome: section.showOnHome !== false,
          showInNav: section.showInNav === true,
        }));

      // Every field is sent explicitly, including false, 0, and "", because the
      // server merge never deletes keys. Site Config owns the rest of postsDisplay.
      const overrides = {
        homeHeroImage: {
          enabled: hero.enabled,
          src: hero.src.trim(),
          alt: hero.alt?.trim() ?? "",
          href: hero.href?.trim() ?? "",
          layout: hero.layout === "aside" ? "aside" : "banner",
          side: hero.side === "left" ? "left" : "right",
          position: hero.position,
          width: hero.width,
          rounded: hero.rounded !== false,
        },
        featuredSectionEnabled: featured.enabled,
        featuredTitle: featured.title,
        featuredViewMode: featured.viewMode,
        showViewToggle: featured.showViewToggle,
        homepageHighlights: {
          ...highlights,
          projectsTitle: highlights.projectsTitle.trim() || "Projects",
          postSlug: highlights.postSlug.trim(),
        },
        homeCategories: {
          enabled: categoriesEnabled,
          position: categoriesPosition,
          sections: cleanSections,
        },
        postsDisplay: {
          showOnHome: postList.enabled,
          homePostsLimit: postList.limit,
          homeTitle: postList.title.trim(),
          homeViewMode: postList.viewMode,
          homeShowViewToggle: postList.showViewToggle,
          homeShowReadTime: postList.showReadTime,
          homeShowDate: postList.showDate,
          homeShowYearHeadings: postList.showYearHeadings,
          homeUnderlineTitles: postList.underlineTitles,
          homePostsReadMore: {
            enabled: postList.readMore.enabled,
            text: postList.readMore.text.trim(),
            link: postList.readMore.link.trim() || "/blog",
          },
        },
      };
      await savePartialOverrides({ overrides });
      // Keep the in memory config current so pages that still read the
      // siteConfig singleton (nav, /blog) see this save without a reload.
      applyRuntimeConfigOverrides(siteConfig, overrides);
      setSavedSnapshot(currentSnapshot);
      addToast("Homepage saved.", "success");
      const navCount = cleanSections.filter((s) => s.showInNav).length;
      const homeCount = cleanSections.filter(
        (s) => s.showOnHome !== false,
      ).length;
      if (!categoriesEnabled && cleanSections.length > 0) {
        addToast(
          navCount > 0
            ? "Sections are hidden on the homepage until Group posts is on. Nav links still show."
            : "Category sections are saved but hidden until Group posts is on.",
          "info",
        );
      } else if (categoriesEnabled && homeCount === 0 && navCount > 0) {
        addToast(
          "Nothing will show on the homepage. Nav links still show.",
          "info",
        );
      }
    } catch {
      addToast("Failed to save homepage settings", "error");
    } finally {
      setSaving(false);
    }
  };

  const saveButton = (className: string) => (
    <button
      type="button"
      className={className}
      onClick={() => void handleSave()}
      disabled={saving || !hydrated}
      aria-busy={saving}
    >
      {saving ? (
        <SpinnerGap size={16} className="animate-spin" />
      ) : (
        <FloppyDisk size={16} />
      )}
      <span>Save homepage</span>
    </button>
  );

  const statusText = saving
    ? "Saving..."
    : !hydrated
      ? "Loading saved settings..."
      : dirty
        ? "Unsaved changes"
        : "Saved";

  return (
    <div className="dashboard-config-section homepage-desk">
      <div className="dashboard-config-header">
        <div>
          <h2>Homepage</h2>
          <p>Arrange what shows on / and where each block sits around the post list.</p>
        </div>
        <div className="dashboard-config-actions">
          {/* Hidden on phones; the sticky bar at the end of the section takes over */}
          {saveButton("dashboard-action-btn primary dashboard-save-inline")}
        </div>
      </div>

      <div className="homepage-desk-grid">
        <div className="homepage-desk-main">
          {/* Homepage image: wide 16:9 strip or vertical beside the intro */}
          <div className="dashboard-config-card">
            <h3>Banner image</h3>
            <p className="config-field-note">
              A wide strip above or below the intro, or a portrait beside it.
            </p>
            <div className="config-field checkbox">
              <label>
                <input
                  type="checkbox"
                  checked={hero.enabled}
                  onChange={(e) =>
                    setHero({ ...hero, enabled: e.target.checked })
                  }
                />
                <span>Show an image on the homepage</span>
              </label>
            </div>

            {hero.src && (
              <div
                className={`home-hero-preview ${hero.layout === "aside" ? "is-aside" : "is-banner"} ${hero.src.split("?")[0].toLowerCase().endsWith(".svg") ? "is-svg" : ""}`}
              >
                <img
                  src={hero.src}
                  alt=""
                  style={
                    hero.layout === "aside"
                      ? undefined
                      : { width: `${hero.width}%` }
                  }
                />
              </div>
            )}

            <div className="config-field">
              <label htmlFor="home-hero-src">Image</label>
              <div className="config-logo-add">
                <input
                  id="home-hero-src"
                  type="text"
                  value={hero.src}
                  placeholder="/images/banner.jpg, .gif, or .svg"
                  onChange={(e) => setHero({ ...hero, src: e.target.value })}
                />
                <button
                  type="button"
                  className="dashboard-action-btn"
                  onClick={() => setPickerOpen(true)}
                >
                  <ImageIcon size={16} />
                  Upload
                </button>
              </div>
              <span className="config-field-note">
                PNG, JPG, GIF, WebP, and SVG. GIFs animate. SVGs stay sharp.
              </span>
            </div>

            <div className="home-field-row">
              <div className="config-field">
                <label htmlFor="home-hero-layout">Layout</label>
                <select
                  id="home-hero-layout"
                  value={hero.layout === "aside" ? "aside" : "banner"}
                  onChange={(e) => {
                    const layout = e.target.value as HomeHeroLayout;
                    setHero({
                      ...hero,
                      layout,
                      width:
                        layout === "aside" && hero.width >= 90 ? 40 : hero.width,
                    });
                  }}
                >
                  <option value="banner">Wide 16:9 banner</option>
                  <option value="aside">Vertical beside intro</option>
                </select>
              </div>
              {hero.layout === "aside" ? (
                <div className="config-field">
                  <label htmlFor="home-hero-side">Side</label>
                  <select
                    id="home-hero-side"
                    value={hero.side === "left" ? "left" : "right"}
                    onChange={(e) =>
                      setHero({ ...hero, side: e.target.value as HomeHeroSide })
                    }
                  >
                    <option value="right">Right</option>
                    <option value="left">Left</option>
                  </select>
                </div>
              ) : (
                <div className="config-field">
                  <label htmlFor="home-hero-position">Position</label>
                  <select
                    id="home-hero-position"
                    value={hero.position}
                    onChange={(e) =>
                      setHero({
                        ...hero,
                        position: e.target.value as HomeHeroImageConfig["position"],
                      })
                    }
                  >
                    <option value="top">Top</option>
                    <option value="bottom">Bottom</option>
                    <option value="both">Top and bottom</option>
                  </select>
                </div>
              )}
            </div>
            <span className="config-field-note">
              {hero.layout === "aside"
                ? "Portrait sits next to the intro. No 16:9 crop."
                : "Wide strip. Any aspect ratio is cropped to 16:9. SVG is not cropped."}
            </span>

            <div className="home-field-row">
              <div className="config-field">
                <label htmlFor="home-hero-alt">Alt text</label>
                <input
                  id="home-hero-alt"
                  type="text"
                  value={hero.alt ?? ""}
                  placeholder="Leave blank for a decorative image"
                  onChange={(e) => setHero({ ...hero, alt: e.target.value })}
                />
              </div>
              <div className="config-field">
                <label htmlFor="home-hero-href">Link (optional)</label>
                <input
                  id="home-hero-href"
                  type="text"
                  value={hero.href ?? ""}
                  placeholder="https://example.com"
                  onChange={(e) => setHero({ ...hero, href: e.target.value })}
                />
              </div>
            </div>

            <div className="config-field">
              <label htmlFor="home-hero-width">Width: {hero.width}%</label>
              <input
                id="home-hero-width"
                type="range"
                min={30}
                max={100}
                step={5}
                value={hero.width}
                onChange={(e) =>
                  setHero({ ...hero, width: parseInt(e.target.value, 10) || 100 })
                }
              />
              <span className="config-field-note">
                {hero.layout === "aside"
                  ? "Desktop image column. Capped so the intro always has room. Phones stack."
                  : "Desktop only. Phones always use the full content width."}
              </span>
            </div>

            <div className="config-field checkbox">
              <label>
                <input
                  type="checkbox"
                  checked={hero.rounded !== false}
                  onChange={(e) =>
                    setHero({ ...hero, rounded: e.target.checked })
                  }
                />
                <span>Rounded corners</span>
              </label>
            </div>
          </div>

          {/* Featured list: every post and page marked featured: true, under the intro */}
          <div className="dashboard-config-card">
            <h3>Featured list</h3>
            <p className="config-field-note">
              Posts and pages with <code>featured: true</code> in their
              frontmatter, listed under the intro. Turning it off here keeps the
              flag, so /blog ordering does not change.
              {featuredCount !== undefined
                ? ` ${featuredCount} ${featuredCount === 1 ? "item is" : "items are"} marked featured right now.`
                : ""}
            </p>
            <div className="config-field checkbox">
              <label>
                <input
                  type="checkbox"
                  checked={featured.enabled}
                  onChange={(e) =>
                    setFeatured({ ...featured, enabled: e.target.checked })
                  }
                />
                <span>Show the featured list</span>
              </label>
            </div>
            {featured.enabled && (
              <div className="home-highlight-group">
                <div className="config-field">
                  <label htmlFor="home-featured-title">Heading</label>
                  <input
                    id="home-featured-title"
                    type="text"
                    value={featured.title}
                    placeholder="Featured"
                    onChange={(e) =>
                      setFeatured({ ...featured, title: e.target.value })
                    }
                  />
                </div>
                <div className="config-field">
                  <label htmlFor="home-featured-view">Layout</label>
                  <select
                    id="home-featured-view"
                    value={featured.viewMode}
                    onChange={(e) =>
                      setFeatured({
                        ...featured,
                        viewMode: e.target.value === "cards" ? "cards" : "list",
                      })
                    }
                  >
                    <option value="list">Titles</option>
                    <option value="cards">Cards</option>
                  </select>
                </div>
                <div className="config-field checkbox">
                  <label>
                    <input
                      type="checkbox"
                      checked={featured.showViewToggle}
                      onChange={(e) =>
                        setFeatured({ ...featured, showViewToggle: e.target.checked })
                      }
                    />
                    <span>Let readers switch between titles and cards</span>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Spotlight post and selected projects, above or below the post list */}
          <div className="dashboard-config-card">
            <h3>Spotlight</h3>
            <p className="config-field-note">
              One hand picked post and a few projects, placed above or below the
              post list. Empty or unpublished selections stay hidden.
            </p>
            <HomepageHighlightsFields
              config={highlights}
              onChange={(next) =>
                setHighlights((current) => ({ ...current, ...next }))
              }
              projects={publishedProjects}
              posts={publishedPosts}
            />
          </div>

          {/* Tag-driven category sections */}
          <div className="dashboard-config-card">
            <h3>Category sections</h3>
            <div className="config-field checkbox">
              <label>
                <input
                  type="checkbox"
                  checked={categoriesEnabled}
                  onChange={(e) => setCategoriesEnabled(e.target.checked)}
                />
                <span>Group posts into sections by tag</span>
              </label>
            </div>
            <span className="config-field-note">
              Each section lists published posts that carry that tag. Show on
              homepage and Show in nav are separate: a section can sit in the
              header only, on / only, or both. A tag with no posts hides the
              homepage heading.
            </span>

            <div className="config-field">
              <label htmlFor="home-categories-position">Position</label>
              <select
                id="home-categories-position"
                value={categoriesPosition}
                onChange={(e) =>
                  setCategoriesPosition(e.target.value as CategoriesPosition)
                }
              >
                <option value="above-posts">Above the post list</option>
                <option value="below-posts">Below the post list</option>
              </select>
            </div>

            {sections.length === 0 ? (
              <p className="config-field-note">
                No sections yet. Add one, then set its tag to match your post
                frontmatter.
              </p>
            ) : (
              <ol className="home-section-list">
                {sections.map((section, index) => {
                  const tagKey = section.tag.trim().toLowerCase();
                  const tagMatch = publishedTags?.find(
                    (entry) => entry.tag.toLowerCase() === tagKey,
                  );
                  return (
                    <li key={index} className="home-section-row">
                      {/* Ordinal ties the row to its place in the running order */}
                      <span className="home-section-ordinal" aria-hidden="true">
                        {index + 1}
                      </span>
                      <div className="home-section-fields">
                        <div className="home-section-fields-row">
                          <input
                            type="text"
                            className="dashboard-field-input"
                            value={section.title}
                            placeholder="Section heading, e.g. Notes"
                            aria-label={`Section ${index + 1} heading`}
                            onChange={(e) =>
                              updateSection(index, { title: e.target.value })
                            }
                          />
                          <input
                            type="text"
                            className="dashboard-field-input"
                            list="home-category-tags"
                            value={section.tag}
                            placeholder="Post tag, e.g. convex"
                            aria-label={`Section ${index + 1} tag`}
                            onChange={(e) =>
                              updateSection(index, { tag: e.target.value })
                            }
                          />
                        </div>
                        {tagKey ? (
                          <span className="config-field-note">
                            {tagMatch
                              ? `${tagMatch.count} published ${tagMatch.count === 1 ? "post" : "posts"}`
                              : "No published posts with this tag"}
                          </span>
                        ) : null}
                        <div className="home-section-options">
                          <label>
                            <span>Limit</span>
                            <input
                              type="number"
                              className="dashboard-field-input"
                              min={1}
                              max={50}
                              value={section.limit ?? 8}
                              onChange={(e) =>
                                updateSection(index, {
                                  limit: parseInt(e.target.value, 10) || 8,
                                })
                              }
                            />
                          </label>
                          <label>
                            <span>Columns</span>
                            <select
                              className="dashboard-items-select"
                              value={String(section.columns ?? 2)}
                              onChange={(e) =>
                                updateSection(index, {
                                  columns: e.target.value === "1" ? 1 : 2,
                                })
                              }
                            >
                              <option value="1">1</option>
                              <option value="2">2</option>
                            </select>
                          </label>
                          <label className="home-section-checkbox">
                            <input
                              type="checkbox"
                              checked={section.showDate === true}
                              onChange={(e) =>
                                updateSection(index, { showDate: e.target.checked })
                              }
                            />
                            <span>Show date</span>
                          </label>
                          <label className="home-section-checkbox">
                            <input
                              type="checkbox"
                              checked={section.showOnHome !== false}
                              onChange={(e) =>
                                updateSection(index, {
                                  showOnHome: e.target.checked,
                                })
                              }
                            />
                            <span>Show on homepage</span>
                          </label>
                          <label className="home-section-checkbox">
                            <input
                              type="checkbox"
                              checked={section.showInNav === true}
                              onChange={(e) =>
                                updateSection(index, {
                                  showInNav: e.target.checked,
                                })
                              }
                            />
                            <span>Show in nav</span>
                          </label>
                        </div>
                        {section.showInNav && tagKey ? (
                          <span className="config-field-note">
                            {section.showOnHome === false
                              ? `Header only. Nav link: /tags/${tagKey}`
                              : `Nav link: /tags/${tagKey}`}
                          </span>
                        ) : null}
                        {section.showOnHome === false &&
                        section.showInNav !== true ? (
                          <span className="config-field-note">
                            Hidden on the homepage and not in nav.
                          </span>
                        ) : null}
                      </div>
                      <div className="config-logo-actions">
                        <button
                          type="button"
                          className="config-logo-btn"
                          onClick={() => moveSection(index, -1)}
                          disabled={index === 0}
                          aria-label={`Move section ${index + 1} up`}
                        >
                          <ArrowUp size={14} />
                        </button>
                        <button
                          type="button"
                          className="config-logo-btn"
                          onClick={() => moveSection(index, 1)}
                          disabled={index === sections.length - 1}
                          aria-label={`Move section ${index + 1} down`}
                        >
                          <ArrowDown size={14} />
                        </button>
                        <button
                          type="button"
                          className="config-logo-btn danger"
                          onClick={() =>
                            setSections((c) => c.filter((_, i) => i !== index))
                          }
                          aria-label={`Remove section ${index + 1}`}
                        >
                          <Trash size={14} />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
            <datalist id="home-category-tags">
              {(publishedTags ?? []).map((entry) => (
                <option key={entry.tag} value={entry.tag} />
              ))}
            </datalist>

            <button
              type="button"
              className="dashboard-action-btn"
              onClick={() =>
                setSections((current) => [
                  ...current,
                  {
                    title: "",
                    tag: "",
                    limit: 8,
                    columns: 2,
                    showDate: false,
                    showOnHome: true,
                    showInNav: false,
                  },
                ])
              }
            >
              <Plus size={16} />
              Add section
            </button>
            <span className="config-field-note">
              Sections with no matching posts are skipped, so an empty tag never
              leaves a heading behind.
            </span>
          </div>

          {/* The main post list. /blog has its own settings in Site Config. */}
          <div className="dashboard-config-card">
            <h3>Post list</h3>
            <p className="config-field-note">
              The main list of published posts on /. Spotlight, projects, and
              category sections sit above or below it. The /blog page has its own
              settings under Site Config, Content.
            </p>
            <div className="config-field checkbox">
              <label>
                <input
                  type="checkbox"
                  checked={postList.enabled}
                  onChange={(e) =>
                    setPostList({ ...postList, enabled: e.target.checked })
                  }
                />
                <span>Show the post list</span>
              </label>
            </div>
            {postList.enabled && (
              <div className="home-highlight-group">
                <div className="home-field-row">
                  <div className="config-field">
                    <label htmlFor="home-posts-title">Heading</label>
                    <input
                      id="home-posts-title"
                      type="text"
                      value={postList.title}
                      placeholder="Leave blank for no heading"
                      onChange={(e) =>
                        setPostList({ ...postList, title: e.target.value })
                      }
                    />
                  </div>
                  <div className="config-field">
                    <label htmlFor="home-posts-limit">How many</label>
                    <input
                      id="home-posts-limit"
                      type="number"
                      min={0}
                      max={100}
                      value={postList.limit}
                      onChange={(e) => {
                        const next = parseInt(e.target.value, 10);
                        setPostList({
                          ...postList,
                          limit: Number.isFinite(next) && next >= 0 ? next : 0,
                        });
                      }}
                    />
                  </div>
                </div>
                <span className="config-field-note">
                  {postList.limit === 0
                    ? "0 shows every published post."
                    : `Shows the ${postList.limit} newest ${postList.limit === 1 ? "post" : "posts"}.`}
                </span>

                <div className="config-field">
                  <label htmlFor="home-posts-view">Layout</label>
                  <select
                    id="home-posts-view"
                    value={postList.viewMode}
                    onChange={(e) =>
                      setPostList({
                        ...postList,
                        viewMode: e.target.value === "cards" ? "cards" : "list",
                      })
                    }
                  >
                    <option value="list">List</option>
                    <option value="cards">Cards</option>
                  </select>
                </div>
                <div className="config-field checkbox">
                  <label>
                    <input
                      type="checkbox"
                      checked={postList.showViewToggle}
                      onChange={(e) =>
                        setPostList({ ...postList, showViewToggle: e.target.checked })
                      }
                    />
                    <span>Let readers switch between list and cards</span>
                  </label>
                </div>

                <div className="home-section-options">
                  <label className="home-section-checkbox">
                    <input
                      type="checkbox"
                      checked={postList.showDate}
                      onChange={(e) =>
                        setPostList({ ...postList, showDate: e.target.checked })
                      }
                    />
                    <span>Date</span>
                  </label>
                  <label className="home-section-checkbox">
                    <input
                      type="checkbox"
                      checked={postList.showReadTime}
                      onChange={(e) =>
                        setPostList({ ...postList, showReadTime: e.target.checked })
                      }
                    />
                    <span>Read time</span>
                  </label>
                  <label className="home-section-checkbox">
                    <input
                      type="checkbox"
                      checked={postList.showYearHeadings}
                      onChange={(e) =>
                        setPostList({ ...postList, showYearHeadings: e.target.checked })
                      }
                    />
                    <span>Year headings</span>
                  </label>
                  <label className="home-section-checkbox">
                    <input
                      type="checkbox"
                      checked={postList.underlineTitles}
                      onChange={(e) =>
                        setPostList({ ...postList, underlineTitles: e.target.checked })
                      }
                    />
                    <span>Underline titles</span>
                  </label>
                </div>

                <div className="config-field checkbox">
                  <label>
                    <input
                      type="checkbox"
                      checked={postList.readMore.enabled}
                      onChange={(e) =>
                        setPostList({
                          ...postList,
                          readMore: { ...postList.readMore, enabled: e.target.checked },
                        })
                      }
                    />
                    <span>Add a read more link under the list</span>
                  </label>
                </div>
                {postList.readMore.enabled && (
                  <>
                    <div className="home-field-row">
                      <div className="config-field">
                        <label htmlFor="home-posts-read-more-text">Link text</label>
                        <input
                          id="home-posts-read-more-text"
                          type="text"
                          value={postList.readMore.text}
                          placeholder="Read more posts"
                          onChange={(e) =>
                            setPostList({
                              ...postList,
                              readMore: { ...postList.readMore, text: e.target.value },
                            })
                          }
                        />
                      </div>
                      <div className="config-field">
                        <label htmlFor="home-posts-read-more-link">Goes to</label>
                        <input
                          id="home-posts-read-more-link"
                          type="text"
                          value={postList.readMore.link}
                          placeholder="/blog"
                          onChange={(e) =>
                            setPostList({
                              ...postList,
                              readMore: { ...postList.readMore, link: e.target.value },
                            })
                          }
                        />
                      </div>
                    </div>
                    <span className="config-field-note">
                      {postList.limit === 0
                        ? "Only shows when How many is above 0 and more posts exist."
                        : "Shows when more posts exist than the limit. A /blog link hides while that route is off."}
                    </span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Running order: what / will render, top to bottom, from the form above */}
        <aside className="homepage-desk-rail" aria-label="Homepage running order">
          <div className="dashboard-config-card home-order-card">
            <h3>Running order</h3>
            <ol className="home-order-list">
              {order.map((block) => (
                <li key={block.id} className={`home-order-row is-${block.state}`}>
                  <span className="home-order-mark" aria-hidden="true" />
                  <span className="home-order-label">{block.label}</span>
                  <span className="home-order-detail">
                    {block.detail ?? (block.state === "off" ? "Off" : "")}
                  </span>
                </li>
              ))}
            </ol>
            <p className="config-field-note">
              Intro, newsletter, and logo gallery keep their Site Config
              placement.
            </p>
            <p
              className={`home-order-status${dirty ? " is-dirty" : ""}`}
              role="status"
            >
              {statusText}
            </p>
          </div>
        </aside>
      </div>

      {/* Phones only: the header Save is a long scroll above the last card */}
      <div className="dashboard-config-savebar">
        {saveButton("dashboard-action-btn primary")}
      </div>

      <ImageUploadModal
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelectUrl={(url) => {
          setHero((current) => ({ ...current, src: url, enabled: true }));
          setPickerOpen(false);
        }}
      />
    </div>
  );
}
