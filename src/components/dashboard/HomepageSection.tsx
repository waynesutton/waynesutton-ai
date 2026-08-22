import { useState, useEffect } from "react";
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
import { ImageUploadModal } from "../ImageUploadModal";
import siteConfig from "../../config/siteConfig";
import type {
  HomeCategorySection,
  HomeHeroImageConfig,
  HomeHeroLayout,
  HomeHeroSide,
} from "../../config/siteConfig";
import { resolveHomeCategories } from "../../utils/homeCategories";

type ToastType = "success" | "error" | "info" | "warning";

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
 * Homepage dashboard section: banner or vertical image beside the intro, plus
 * tag-driven category sections. Saves through savePartialOverrides so it only
 * writes the two homepage keys and leaves the rest of Site Config alone.
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
  const [categoriesEnabled, setCategoriesEnabled] = useState(
    siteConfig.homeCategories?.enabled === true,
  );
  const [categoriesPosition, setCategoriesPosition] = useState<
    "above-posts" | "below-posts"
  >(siteConfig.homeCategories?.position ?? "above-posts");
  const [sections, setSections] = useState<Array<HomeCategorySection>>(() =>
    (siteConfig.homeCategories?.sections ?? []).map((section) => ({
      ...section,
    })),
  );
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const savePartialOverrides = useMutation(
    api.siteConfigData.savePartialOverrides,
  );
  const publishedTags = useQuery(api.posts.getAllTags);
  const configOverrides = useQuery(api.siteConfigData.getOverrides);

  // Seed from live overrides once so a reload shows the last Save, not the file
  useEffect(() => {
    if (hydrated || configOverrides === undefined) return;
    const resolved = resolveHomeCategories(configOverrides);
    setCategoriesEnabled(resolved.enabled);
    setCategoriesPosition(resolved.position);
    setSections(resolved.sections.map((section) => ({ ...section })));
    const savedHero = configOverrides?.homeHeroImage;
    if (savedHero && typeof savedHero === "object" && !Array.isArray(savedHero)) {
      setHero((current) => ({
        ...current,
        ...(savedHero as Partial<HomeHeroImageConfig>),
      }));
    }
    setHydrated(true);
  }, [configOverrides, hydrated]);

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

      await savePartialOverrides({
        overrides: {
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
          homeCategories: {
            enabled: categoriesEnabled,
            position: categoriesPosition,
            sections: cleanSections,
          },
        },
      });
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

  return (
    <div className="dashboard-config-section">
      <div className="dashboard-config-grid">
        {/* Homepage image: wide 16:9 strip or vertical beside the intro */}
        <div className="dashboard-config-card">
          <h3>Banner image</h3>
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
            <label>Image</label>
            <div className="config-logo-add">
              <input
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

          <div className="config-field">
            <label>Layout</label>
            <select
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
            <span className="config-field-note">
              {hero.layout === "aside"
                ? "Portrait sits next to the intro. No 16:9 crop."
                : "Wide strip. Any aspect ratio is cropped to 16:9. SVG is not cropped."}
            </span>
          </div>

          <div className="config-field">
            <label>Alt text</label>
            <input
              type="text"
              value={hero.alt ?? ""}
              placeholder="Leave blank for a decorative image"
              onChange={(e) => setHero({ ...hero, alt: e.target.value })}
            />
          </div>

          <div className="config-field">
            <label>Link (optional)</label>
            <input
              type="text"
              value={hero.href ?? ""}
              placeholder="https://example.com"
              onChange={(e) => setHero({ ...hero, href: e.target.value })}
            />
          </div>

          {hero.layout === "aside" ? (
            <div className="config-field">
              <label>Side</label>
              <select
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
              <label>Position</label>
              <select
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

          <div className="config-field">
            <label>Width: {hero.width}%</label>
            <input
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
            header only, on `/` only, or both. A tag with no posts hides the
            homepage heading.
          </span>

          <div className="config-field">
            <label>Position</label>
            <select
              value={categoriesPosition}
              onChange={(e) =>
                setCategoriesPosition(
                  e.target.value as "above-posts" | "below-posts",
                )
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
            <ul className="home-section-list">
              {sections.map((section, index) => {
                const tagKey = section.tag.trim().toLowerCase();
                const tagMatch = publishedTags?.find(
                  (entry) => entry.tag.toLowerCase() === tagKey,
                );
                return (
                <li key={index} className="home-section-row">
                  <div className="home-section-fields">
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
            </ul>
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
      </div>

      <div className="dashboard-config-actions">
        <button
          type="button"
          className="dashboard-action-btn primary"
          onClick={() => void handleSave()}
          disabled={saving}
          aria-busy={saving}
        >
          {saving ? (
            <SpinnerGap size={16} className="animate-spin" />
          ) : (
            <FloppyDisk size={16} />
          )}
          <span>Save homepage</span>
        </button>
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
