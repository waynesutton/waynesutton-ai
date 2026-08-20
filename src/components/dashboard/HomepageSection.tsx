import { useState } from "react";
import { useMutation } from "convex/react";
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
} from "../../config/siteConfig";

type ToastType = "success" | "error" | "info" | "warning";

const DEFAULT_HERO: HomeHeroImageConfig = {
  enabled: false,
  src: "",
  alt: "",
  href: "",
  position: "top",
  width: 100,
  rounded: true,
};

/**
 * Homepage dashboard section: the 16:9 banner with a width scaler, and
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

  const savePartialOverrides = useMutation(
    api.siteConfigData.savePartialOverrides,
  );

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
        }));

      await savePartialOverrides({
        overrides: {
          homeHeroImage: {
            enabled: hero.enabled,
            src: hero.src.trim(),
            alt: hero.alt?.trim() ?? "",
            href: hero.href?.trim() ?? "",
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
      addToast("Homepage saved. Changes go live on next page load.", "success");
    } catch {
      addToast("Failed to save homepage settings", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="dashboard-config-section">
      <div className="dashboard-config-grid">
        {/* 16:9 banner */}
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
              <span>Show a 16:9 banner on the homepage</span>
            </label>
          </div>

          {hero.src && (
            <div className="home-hero-preview">
              <img src={hero.src} alt="" style={{ width: `${hero.width}%` }} />
            </div>
          )}

          <div className="config-field">
            <label>Image</label>
            <div className="config-logo-add">
              <input
                type="text"
                value={hero.src}
                placeholder="/images/banner.jpg or https://..."
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
              Any aspect ratio works. It is cropped to 16:9 on display.
            </span>
          </div>

          <div className="config-field">
            <label>Alt text</label>
            <input
              type="text"
              value={hero.alt ?? ""}
              placeholder="Leave blank for a decorative banner"
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
              Desktop only. Phones always use the full content width.
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
              {sections.map((section, index) => (
                <li key={index} className="home-section-row">
                  <div className="home-section-fields">
                    <input
                      type="text"
                      value={section.title}
                      placeholder="Section heading, e.g. Notes"
                      aria-label={`Section ${index + 1} heading`}
                      onChange={(e) =>
                        updateSection(index, { title: e.target.value })
                      }
                    />
                    <input
                      type="text"
                      value={section.tag}
                      placeholder="Post tag, e.g. convex"
                      aria-label={`Section ${index + 1} tag`}
                      onChange={(e) =>
                        updateSection(index, { tag: e.target.value })
                      }
                    />
                    <div className="home-section-options">
                      <label>
                        <span>Limit</span>
                        <input
                          type="number"
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
                    </div>
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
              ))}
            </ul>
          )}

          <button
            type="button"
            className="dashboard-action-btn"
            onClick={() =>
              setSections((current) => [
                ...current,
                { title: "", tag: "", limit: 8, columns: 2, showDate: false },
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
        >
          {saving ? (
            <SpinnerGap size={16} className="animate-spin" />
          ) : (
            <FloppyDisk size={16} />
          )}
          {saving ? "Saving..." : "Save homepage"}
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
